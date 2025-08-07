import { createServerFileRoute } from "@tanstack/react-start/server";
import { streamText } from "ai";
import { createInferClient } from "~/lib/infer-client";

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  POST: async ({ request }) => {
    // Get access key from headers or query params
    const url = new URL(request.url);
    const accessKey =
      request.headers.get("Authorization")?.replace("Bearer ", "") ||
      url.searchParams.get("access_key") ||
      "demo"; // Default for demo purposes

    try {
      console.log("Chat API called with access key:", accessKey);
      const { messages } = await request.json();

      const openai = createInferClient(accessKey);

      const result = await streamText({
        model: openai("gpt-4o-mini"),
        messages,
        async onFinish() {
          // Optional: save to database here
        },
      });

      return result.toDataStreamResponse();
    } catch (error) {
      console.error("Chat API error:", error);
      return new Response("Error processing chat request", { status: 500 });
    }
  },
});
