import type { Handler, HandlerResponse } from "@netlify/functions";

// Modal endpoint for the tom agent
const MODAL_ENDPOINT = "https://heyo--tom-agent-chat.modal.run";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { messages, stream = true } = JSON.parse(event.body || "{}");

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

    console.log("[DEBUG] Proxying request to Modal with", messages.length, "messages, stream:", stream);

    // Proxy to Modal endpoint
    const response = await fetch(MODAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, stream }),
    });

    console.log("[DEBUG] Modal response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DEBUG] Modal error response:", errorText);
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Modal request failed",
          debug: {
            status: response.status,
            response: errorText.substring(0, 500),
          },
        }),
      };
    }

    // For streaming responses, pass through the SSE stream
    if (stream && response.headers.get("content-type")?.includes("text/event-stream")) {
      const body = await response.text();

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
        body,
      } as HandlerResponse;
    }

    // Non-streaming response
    const data = await response.json();

    // Check for error response from Modal
    if (data.error) {
      console.error("[DEBUG] Modal returned error:", data.error);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: data.error,
        }),
      };
    }

    console.log("[DEBUG] Modal response received successfully");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ response: data.response }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error proxying to Modal:", {
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
