# Modal Agent Setup

This directory contains the Modal function for Tom's AI agent.

## Prerequisites

1. Install Modal CLI:
   ```bash
   pip install modal
   modal setup
   ```

2. Create the Anthropic API key secret in Modal:
   ```bash
   modal secret create anthropic-api-key ANTHROPIC_API_KEY=sk-ant-...
   ```

## Deploy

```bash
modal deploy modal/tom_agent.py
```

This will output a URL like:
```
https://your-workspace--tom-agent-chat.modal.run
```

## Update Netlify Function

After deploying, update `netlify/functions/chat.ts` to proxy to your Modal endpoint:

```typescript
const MODAL_ENDPOINT = "https://your-workspace--tom-agent-chat.modal.run";

const response = await fetch(MODAL_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages }),
});
```

## Test Locally

```bash
modal run modal/tom_agent.py::chat --request '{"messages":[{"role":"user","content":"Hello!"}]}'
```

## Endpoints

- `POST /` - Chat endpoint (accepts `{"messages": [...]}`)
- `GET /health` - Health check
