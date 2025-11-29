"""
Modal function for Tom's AI agent using Claude Agent SDK.

Deploy with: modal deploy modal/tom_agent.py
"""

import modal

# Create image with non-root user (SDK won't run bypass mode as root)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("sudo")
    .run_commands(
        "useradd -m -s /bin/bash agent",
        "echo 'agent ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers",
    )
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
async def chat(body: dict):
    """Chat endpoint using Claude Agent SDK with streaming."""
    import json
    import subprocess
    import os
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

    # Write a Python script to run as non-root user
    script = f'''
import asyncio
import json
from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, query

async def main():
    options = ClaudeAgentOptions(
        system_prompt="""{SYSTEM_PROMPT}""",
        permission_mode="bypassPermissions",
    )

    prompt = """{prompt.replace('"', '\\"')}"""

    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(json.dumps({{"text": block.text}}), flush=True)
    print(json.dumps({{"done": True}}), flush=True)

asyncio.run(main())
'''

    async def generate():
        try:
            # Run as non-root user
            process = subprocess.Popen(
                ["sudo", "-u", "agent", "python3", "-c", script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env={**os.environ, "ANTHROPIC_API_KEY": os.environ.get("ANTHROPIC_API_KEY", "")},
                bufsize=1,
            )

            for line in iter(process.stdout.readline, ''):
                if line.strip():
                    yield f"data: {line.strip()}\n\n"

            process.wait()
            if process.returncode != 0:
                stderr = process.stderr.read()
                print(f"[ERROR] {stderr}")
                yield f"data: {json.dumps({'error': stderr[:500]})}\n\n"

        except Exception as e:
            print(f"[ERROR] {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    return {"status": "ok"}


@app.function(
    secrets=[modal.Secret.from_name("anthropic-api-key")],
    timeout=300,
    image=image,
)
@modal.fastapi_endpoint(method="GET")
async def test():
    """Simple test endpoint to verify SDK works."""
    import subprocess
    import os

    script = '''
import asyncio
import json
from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, query

async def main():
    options = ClaudeAgentOptions(
        system_prompt="You are helpful. Be brief.",
        permission_mode="bypassPermissions",
    )

    result = []
    async for message in query(prompt="Say hello in 5 words or less", options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    result.append(block.text)
    print(json.dumps({"success": True, "response": "".join(result)}))

asyncio.run(main())
'''

    try:
        result = subprocess.run(
            ["sudo", "-u", "agent", "python3", "-c", script],
            capture_output=True,
            text=True,
            timeout=60,
            env={**os.environ, "ANTHROPIC_API_KEY": os.environ.get("ANTHROPIC_API_KEY", "")},
        )

        if result.returncode == 0:
            import json
            return json.loads(result.stdout.strip())
        else:
            return {"success": False, "error": result.stderr}
    except Exception as e:
        return {"success": False, "error": str(e)}
