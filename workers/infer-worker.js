// Simple OpenAI proxy - forwards requests directly to OpenAI API

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers for browser requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Access-Key",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Access key validation function
    const validateAccessKey = () => {
      // Check if access keys are configured
      if (!env.ACCESS_KEYS) {
        return {
          valid: false,
          error: "Access keys not configured - access denied",
        };
      }

      // Parse access keys (comma-separated list)
      const validKeys = env.ACCESS_KEYS.split(",").map((k) => k.trim());

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

    // Chat completion endpoint - OpenAI compatible for AI SDK
    if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
      // Validate access key
      const auth = validateAccessKey();
      if (!auth.valid) {
        return new Response(JSON.stringify({ error: auth.error }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      try {
        const body = await request.json();

        if (!env.OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({
              error: "OpenAI API key not configured",
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            },
          );
        }

        // Forward the request directly to OpenAI
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify(body),
        });

        // Return the response with CORS headers
        return new Response(openaiResponse.body, {
          status: openaiResponse.status,
          headers: {
            ...Object.fromEntries(openaiResponse.headers.entries()),
            ...corsHeaders,
            "Content-Encoding": "none", // Prevent proxy compression for streaming
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error.message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          },
        );
      }
    }

    // Root endpoint - basic info
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify(
          {
            service: "Infer Worker - OpenAI Compatible API",
            endpoint: "/v1/chat/completions",
            models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
          },
          null,
          2,
        ),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // 404 for other paths
    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
  },
};
