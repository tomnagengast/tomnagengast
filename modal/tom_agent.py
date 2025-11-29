"""
Modal sandbox for running shell commands.

Deploy with: modal deploy modal/tom_agent.py
"""

import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("sudo", "curl", "git", "vim", "htop", "tree", "neofetch")
    .run_commands(
        "useradd -m -s /bin/bash tom",
        "echo 'tom ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers",
    )
    .pip_install("fastapi[standard]")
)

app = modal.App("tom-agent", image=image)


@app.function(timeout=300, image=image)
@modal.fastapi_endpoint(method="POST")
def shell(body: dict):
    """Execute a shell command and stream output."""
    import subprocess
    import os
    import json
    from fastapi.responses import StreamingResponse

    command = body.get("command", "").strip()

    if not command:
        return {"output": ""}

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
                    "PATH": "/usr/local/bin:/usr/bin:/bin",
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


@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    return {"status": "ok"}
