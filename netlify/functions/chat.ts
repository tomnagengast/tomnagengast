import Anthropic from "@anthropic-ai/sdk";
import type { Handler } from "@netlify/functions";

const anthropic = new Anthropic();

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

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";

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
