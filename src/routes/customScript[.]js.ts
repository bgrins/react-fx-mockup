import { createServerFileRoute } from "@tanstack/react-start/server";
export const ServerRoute = createServerFileRoute("/customScript.js").methods({
  GET: () => {
    return new Response('console.log("Hello from customScript.js!")', {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  },
});
