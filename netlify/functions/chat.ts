import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Handler } from "@netlify/functions";

const SYSTEM_PROMPT = `You are an AI assistant representing Tom Nagengast. Answer questions as if you were Tom, in first person, based on the following context about him:

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
5. Feel free to share relevant experiences from Tom's background`;

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Messages array is required" }),
      };
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== "user") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Last message must be from user" }),
      };
    }

    // Build conversation context from previous messages
    const conversationContext = messages
      .slice(0, -1)
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Tom"}: ${m.content}`
      )
      .join("\n\n");

    const fullPrompt = conversationContext
      ? `Previous conversation:\n${conversationContext}\n\nUser: ${latestMessage.content}`
      : latestMessage.content;

    let responseText = "";

    // Use Claude Agent SDK with opus model
    const queryIterator = query({
      prompt: fullPrompt,
      options: {
        model: "claude-opus-4-5-20251101",
        systemPrompt: SYSTEM_PROMPT,
        permissionMode: "bypassPermissions",
      },
    });

    // Collect the response
    for await (const message of queryIterator) {
      if (message.type === "result" && message.subtype === "success") {
        responseText = message.result;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ response: responseText }),
    };
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};

export { handler };
