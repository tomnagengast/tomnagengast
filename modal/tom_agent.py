"""
Modal function for Tom's AI agent using Claude Code CLI.

Deploy with: modal deploy modal/tom_agent.py
"""

import modal
import subprocess
import json
import os

# Build image with Node.js and Claude Code CLI
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl", "ca-certificates", "gnupg")
    # Install Node.js 20
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt-get install -y nodejs",
    )
    # Install Claude Code CLI globally
    .run_commands("npm install -g @anthropic-ai/claude-code")
    .pip_install("fastapi[standard]")
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
    timeout=300,  # 5 minute timeout for longer conversations
)
@modal.fastapi_endpoint(method="POST")
def chat(request: dict):
    """
    Chat endpoint that uses Claude Code CLI.

    Request body:
    {
        "messages": [
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "What do you work on?"}
        ]
    }
    """
    messages = request.get("messages", [])

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

    try:
        # Run Claude Code CLI
        # Using --print to just get the response without interactive mode
        result = subprocess.run(
            [
                "claude",
                "--print",
                "--model", "claude-sonnet-4-20250514",
                "--max-turns", "1",
                "-p", combined_prompt,
            ],
            capture_output=True,
            text=True,
            timeout=120,
            env={**os.environ, "ANTHROPIC_API_KEY": os.environ.get("ANTHROPIC_API_KEY", "")},
        )

        if result.returncode != 0:
            return {
                "error": "Claude CLI failed",
                "debug": {
                    "stderr": result.stderr[:500] if result.stderr else None,
                    "returncode": result.returncode,
                }
            }

        response_text = result.stdout.strip()

        return {"response": response_text}

    except subprocess.TimeoutExpired:
        return {"error": "Request timed out"}
    except Exception as e:
        return {
            "error": str(e),
            "debug": {"type": type(e).__name__}
        }


# Health check endpoint
@app.function()
@modal.fastapi_endpoint(method="GET")
def health():
    return {"status": "ok", "service": "tom-agent"}
