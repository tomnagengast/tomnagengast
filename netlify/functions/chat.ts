import type { Handler } from "@netlify/functions";
import { createAgent } from "@anthropic-ai/claude-agent-sdk";

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

    console.log("[DEBUG] Creating agent with Claude Agent SDK");

    // Create agent with no tools (API-only mode)
    const agent = await createAgent({
      model: "claude-sonnet-4-20250514",
      tools: [], // Disable tools to avoid subprocess spawning
      systemPrompt: SYSTEM_PROMPT,
    });

    console.log("[DEBUG] Agent created, sending message");

    // Format messages for the agent
    const agentMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await agent.respond({
      messages: agentMessages,
    });

    console.log("[DEBUG] Response received from agent");

    // Extract text response
    const responseText = typeof response === "string"
      ? response
      : response?.content || JSON.stringify(response);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ response: responseText }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error with Claude Agent SDK:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to process request",
        debug: {
          message: errorMessage,
          stack: errorStack,
        },
      }),
    };
  }
};

export { handler };
