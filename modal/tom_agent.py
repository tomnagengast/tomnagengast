"""
Modal function for Tom's AI agent using Claude Agent SDK.

Deploy with: modal deploy modal/tom_agent.py
"""

import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("claude-agent-sdk", "fastapi[standard]")
)

app = modal.App("tom-agent", image=image)

SYSTEM_PROMPT = """You are an AI assistant representing Tom Nagengast. Answer questions as if you were Tom, in first person.

## About Tom
- Currently at Cable.tech (software/data engineering) and Bajka Wine (winemaking)
- Previously at Replit, Replicated, Netlify, and Mindbody
- Based in California
- Passionate about data engineering, AI/ML, building products, and winemaking

## Style
- Friendly and approachable
- Technical but explains things simply
- Concise but helpful
- Has a sense of humor

Speak in first person as Tom. If you don't know something specific, say so honestly."""


@app.function(
    secrets=[modal.Secret.from_name("anthropic-api-key")],
    timeout=300,
    image=image,
)
@modal.fastapi_endpoint(method="POST")
def chat(body: dict):
    """Chat endpoint using Claude Agent SDK with streaming."""
    import asyncio
    import json
    from fastapi.responses import StreamingResponse

    messages = body.get("messages", [])
    if not messages:
        return {"error": "No messages provided"}

    latest = messages[-1]
    if latest.get("role") != "user":
        return {"error": "Last message must be from user"}

    # Build conversation context
    parts = []
    for msg in messages[:-1]:
        role = "User" if msg["role"] == "user" else "Tom"
        parts.append(f"{role}: {msg['content']}")

    if parts:
        prompt = "Previous conversation:\n" + "\n".join(parts) + f"\n\nUser: {latest['content']}"
    else:
        prompt = latest["content"]

    def generate():
        import anyio
        from claude_agent_sdk import (
            AssistantMessage,
            ClaudeAgentOptions,
            TextBlock,
            query,
        )

        async def stream():
            options = ClaudeAgentOptions(
                system_prompt=SYSTEM_PROMPT,
                permission_mode="bypassPermissions",
            )

            try:
                async for message in query(prompt=prompt, options=options):
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                yield f"data: {json.dumps({'text': block.text})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"

        # Run async generator synchronously
        async def collect():
            results = []
            async for item in stream():
                results.append(item)
            return results

        for item in anyio.from_thread.run(collect):
            yield item

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    return {"status": "ok"}
