import { createServerFileRoute } from "@tanstack/react-start/server";
import { json } from "@tanstack/react-start";

export const ServerRoute = createServerFileRoute("/api/infer/v1/chat/completions").methods({
  POST: async ({ request }) => {
    const url = new URL(request.url);

    // Access key validation
    const validateAccessKey = () => {
      // Get access keys from environment
      const ACCESS_KEYS = process.env.ACCESS_KEYS;

      if (!ACCESS_KEYS) {
        return {
          valid: false,
          error: "Access keys not configured - access denied",
        };
      }

      // Parse access keys (comma-separated list)
      const validKeys = ACCESS_KEYS.split(",").map((k) => k.trim());

      // Get access key from request
      const accessKey =
        request.headers.get("X-Access-Key") ||
        request.headers.get("Authorization")?.replace("Bearer ", "") ||
        url.searchParams.get("access_key");

      if (!accessKey || !validKeys.includes(accessKey)) {
        return {
          valid: false,
          error: "Invalid or missing access key",
        };
      }

      return { valid: true };
    };

    // Validate access key
    const auth = validateAccessKey();
    if (!auth.valid) {
      return json(
        { error: auth.error },
        {
          status: 401,
        },
      );
    }

    try {
      const body = await request.json();
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

      if (!OPENAI_API_KEY) {
        return json(
          {
            error: "OpenAI API key not configured",
          },
          {
            status: 500,
          },
        );
      }

      // Forward the request directly to OpenAI
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      // Return the response
      const responseHeaders = new Headers();

      // Copy headers from OpenAI response, but skip problematic ones
      for (const [key, value] of openaiResponse.headers.entries()) {
        const lowerKey = key.toLowerCase();
        // Skip headers that can cause issues when proxying
        if (
          lowerKey === "set-cookie" ||
          lowerKey === "strict-transport-security" ||
          lowerKey === "content-encoding"
        ) {
          continue;
        }
        responseHeaders.set(key, value);
      }

      return new Response(openaiResponse.body, {
        status: openaiResponse.status,
        headers: responseHeaders,
      });
    } catch (error) {
      return json(
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        {
          status: 500,
        },
      );
    }
  },
});
