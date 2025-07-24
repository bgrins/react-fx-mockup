import { createServerFileRoute } from "@tanstack/react-start/server";
import { json } from "@tanstack/react-start";

export const ServerRoute = createServerFileRoute("/api/proxy").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return json({ error: "URL parameter is required" }, { status: 400 });
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        let html = await response.text();

        // Inject base tag to handle relative URLs
        const baseUrl = new URL(targetUrl).origin;
        const baseTag = `<base href="${baseUrl}/">`;
        html = html.replace(/<head[^>]*>/, `$&${baseTag}`);

        // Rewrite links to go through proxy
        html = html.replace(/href="(https?:\/\/[^"]+)"/g, (_, url) => {
          return `href="/api/proxy?url=${encodeURIComponent(url)}"`;
        });

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        });
      } else {
        // For non-HTML content, return as-is
        const body = await response.arrayBuffer();
        return new Response(body, {
          headers: {
            "Content-Type": contentType,
          },
        });
      }
    } catch (error) {
      console.error("Proxy error:", error);
      return json({ error: "Failed to fetch the requested URL" }, { status: 500 });
    }
  },
});
