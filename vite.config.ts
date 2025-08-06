import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.build.json"],
    }),
    tanstackStart({ customViteReactPlugin: true, target: "cloudflare-module" }),
    viteReact(),
  ],
});
