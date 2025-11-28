"""
Modal function for Tom's AI agent using Anthropic SDK with streaming.

Deploy with: modal deploy modal/tom_agent.py
"""

import modal

# Build image with Anthropic SDK
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("anthropic", "fastapi[standard]")
)

app = modal.App("tom-agent", image=image)

SYSTEM_PROMPT = """You are an AI assistant representing Tom Nagengast. Answer questions as if you were Tom, in first person, based on the following context about him:

## About Tom
- Currently working at Cable.tech (software/data engineering) and Bajka Wine (winemaking)
- Previously worked at Replit (data engineering, AI data pipelines), Replicated, Netlify (data team, operational analytics), and Mindbody
- Based in California
- Passionate about data engineering, AI/ML, building products, and winemaking

## Work & Expertise
- Data engineering and pipelines
- AI/ML applications and data infrastructure
- Building developer tools and products
- Full-stack development with modern frameworks

## Interests
- Wine making at Bajka Wine
- Technology and startups
- Building things with code

## Communication Style
- Friendly and approachable
- Technical but can explain things simply
- Enjoys sharing knowledge and experiences
- Has a sense of humor

When answering:
1. Speak in first person as Tom
2. Be conversational and friendly
3. If you don't know something specific about Tom, say so honestly
4. Keep responses concise but helpful
5. Feel free to share relevant experiences from Tom's background"""


@app.function(
    secrets=[modal.Secret.from_name("anthropic-api-key")],
    timeout=300,
    image=image,
)
@modal.fastapi_endpoint(method="POST")
async def chat(request):
    """
    Streaming chat endpoint using Anthropic SDK.
    Returns Server-Sent Events for real-time streaming.
    """
    import os
    import json
    import anthropic
    from fastapi.responses import StreamingResponse

    body = await request.json()
    messages = body.get("messages", [])
    stream = body.get("stream", True)

    if not messages:
        return {"error": "No messages provided"}

    # Get the latest user message
    latest_message = messages[-1]
    if latest_message.get("role") != "user":
        return {"error": "Last message must be from user"}

    # Convert to Anthropic format
    anthropic_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
    ]

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    if stream:
        async def generate():
            try:
                with client.messages.stream(
                    model="claude-sonnet-4-20250514",
                    max_tokens=1024,
                    system=SYSTEM_PROMPT,
                    messages=anthropic_messages,
                ) as stream_response:
                    for text in stream_response.text_stream:
                        # Send as SSE format
                        yield f"data: {json.dumps({'text': text})}\n\n"

                # Send done signal
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    else:
        # Non-streaming fallback
        try:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=anthropic_messages,
            )

            response_text = "".join(
                block.text for block in response.content
                if hasattr(block, "text")
            )

            return {"response": response_text}
        except Exception as e:
            return {"error": str(e)}


# Health check endpoint
@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    return {"status": "ok", "service": "tom-agent"}
