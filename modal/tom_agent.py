"""
Modal function for Tom's AI agent using Claude Agent SDK with tools.

Deploy with: modal deploy modal/tom_agent.py
"""

import modal

# Build image with Claude Agent SDK and Node.js for Claude Code
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl", "ca-certificates", "gnupg")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs",
    )
    .run_commands("npm install -g @anthropic-ai/claude-code")
    .pip_install("anthropic", "fastapi[standard]", "pydantic")
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
5. Feel free to share relevant experiences from Tom's background

You have access to tools including web search. Use them when helpful to provide accurate, up-to-date information."""


@app.function(
    secrets=[modal.Secret.from_name("anthropic-api-key")],
    timeout=300,
    image=image,
)
@modal.fastapi_endpoint(method="POST")
def chat(body: dict):
    """
    Chat endpoint using Claude Code CLI with tools.
    Returns Server-Sent Events for real-time streaming.
    """
    import os
    import json
    import subprocess
    from fastapi.responses import StreamingResponse

    messages = body.get("messages", [])
    stream = body.get("stream", True)

    if not messages:
        return {"error": "No messages provided"}

    # Get the latest user message
    latest_message = messages[-1]
    if latest_message.get("role") != "user":
        return {"error": "Last message must be from user"}

    # Build conversation context
    conversation_parts = []
    for msg in messages[:-1]:
        role = "User" if msg["role"] == "user" else "Tom"
        conversation_parts.append(f"{role}: {msg['content']}")

    if conversation_parts:
        full_prompt = f"Previous conversation:\n" + "\n\n".join(conversation_parts) + f"\n\nUser: {latest_message['content']}"
    else:
        full_prompt = latest_message["content"]

    # Combine system prompt with user prompt
    combined_prompt = f"{SYSTEM_PROMPT}\n\n---\n\nRespond to this message:\n{full_prompt}"

    env = {**os.environ, "ANTHROPIC_API_KEY": os.environ.get("ANTHROPIC_API_KEY", "")}

    if stream:
        def generate():
            try:
                # Run Claude Code CLI with streaming
                process = subprocess.Popen(
                    [
                        "claude",
                        "--print",
                        "--model", "claude-sonnet-4-20250514",
                        "--allowedTools", "WebSearch",
                        "-p", combined_prompt,
                    ],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    env=env,
                    bufsize=1,
                )

                # Stream stdout line by line
                for line in iter(process.stdout.readline, ''):
                    if line:
                        yield f"data: {json.dumps({'text': line})}\n\n"

                process.wait()

                if process.returncode != 0:
                    stderr = process.stderr.read()
                    yield f"data: {json.dumps({'error': f'CLI failed: {stderr[:500]}'})}\n\n"
                else:
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
            result = subprocess.run(
                [
                    "claude",
                    "--print",
                    "--model", "claude-sonnet-4-20250514",
                    "--allowedTools", "WebSearch",
                    "-p", combined_prompt,
                ],
                capture_output=True,
                text=True,
                timeout=120,
                env=env,
            )

            if result.returncode != 0:
                return {
                    "error": "Claude CLI failed",
                    "debug": {"stderr": result.stderr[:500] if result.stderr else None}
                }

            return {"response": result.stdout.strip()}

        except subprocess.TimeoutExpired:
            return {"error": "Request timed out"}
        except Exception as e:
            return {"error": str(e)}


# Health check endpoint
@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    return {"status": "ok", "service": "tom-agent"}
