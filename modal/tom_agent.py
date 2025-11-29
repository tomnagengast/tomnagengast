"""
Modal function for Tom's terminal sandbox.

Deploy with: modal deploy modal/tom_agent.py
"""

import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("sudo", "curl", "git", "vim", "htop", "tree")
    .run_commands(
        "useradd -m -s /bin/bash tom",
        "echo 'tom ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers",
    )
    .pip_install("fastapi[standard]")
)

app = modal.App("tom-agent", image=image)

WELCOME_MESSAGE = """Welcome to Tom's sandbox! 🖥️

This is a real Linux shell running in the cloud.
Try: ls, pwd, whoami, echo "hello", or any bash command.

Type 'tom' to chat with the AI assistant.
Type 'exit' to close the terminal.
"""


@app.function(
    secrets=[modal.Secret.from_name("anthropic-api-key")],
    timeout=300,
    image=image,
)
@modal.fastapi_endpoint(method="POST")
def shell(body: dict):
    """Execute a shell command and stream output."""
    import subprocess
    import os
    import json
    from fastapi.responses import StreamingResponse

    command = body.get("command", "").strip()

    if not command:
        return {"output": "", "exit_code": 0}

    # Special commands
    if command == "welcome":
        return {"output": WELCOME_MESSAGE, "exit_code": 0}

    # Handle 'tom' command - delegate to AI
    if command.startswith("tom "):
        return handle_tom_chat(command[4:], body.get("history", []))

    def generate():
        try:
            process = subprocess.Popen(
                ["sudo", "-u", "tom", "bash", "-c", command],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd="/home/tom",
                env={
                    **os.environ,
                    "HOME": "/home/tom",
                    "USER": "tom",
                    "TERM": "xterm-256color",
                },
                bufsize=1,
            )

            for line in iter(process.stdout.readline, ''):
                yield f"data: {json.dumps({'output': line})}\n\n"

            process.wait()
            yield f"data: {json.dumps({'done': True, 'exit_code': process.returncode})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


def handle_tom_chat(message: str, history: list):
    """Handle chat with Tom's AI assistant."""
    import subprocess
    import os
    import json
    from fastapi.responses import StreamingResponse

    # Escape message for embedding in Python script
    escaped_message = message.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

    # Install SDK if needed and run query
    script = f'''
import asyncio
import json
from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, query

SYSTEM_PROMPT = """You are Tom Nagengast's AI assistant in his terminal.
- Currently at Cable.tech and Bajka Wine
- Previously at Replit, Replicated, Netlify, Mindbody
- Based in California
- Passionate about data engineering, AI/ML, and winemaking
Be friendly, concise, and helpful. Speak as Tom in first person."""

async def main():
    options = ClaudeAgentOptions(
        system_prompt=SYSTEM_PROMPT,
        permission_mode="bypassPermissions",
    )
    async for msg in query(prompt="{escaped_message}", options=options):
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if isinstance(block, TextBlock):
                    print(json.dumps({{"output": block.text}}), flush=True)
    print(json.dumps({{"done": True}}), flush=True)

asyncio.run(main())
'''

    def generate():
        try:
            # Need claude-agent-sdk installed
            subprocess.run(["pip", "install", "-q", "claude-agent-sdk"],
                          capture_output=True, timeout=60)

            process = subprocess.Popen(
                ["sudo", "-u", "tom", "python3", "-c", script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env={
                    **os.environ,
                    "ANTHROPIC_API_KEY": os.environ.get("ANTHROPIC_API_KEY", ""),
                    "HOME": "/home/tom",
                },
                bufsize=1,
            )

            for line in iter(process.stdout.readline, ''):
                if line.strip():
                    yield f"data: {line.strip()}\n\n"

            process.wait()
            if process.returncode != 0:
                stderr = process.stderr.read()
                if stderr:
                    yield f"data: {json.dumps({'error': stderr[:500]})}\n\n"

        except Exception as e:
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
