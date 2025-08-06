This project creates an interactive mockup of the modern Firefox UI using TypeScript, React, Tanstack. The mockup should precisely match Firefox's visual design (available with the Figma MCP tool) while providing realistic interactive functionality.

You will have a dev server running at `localhost:3000`, you do not need to start it yourself. You can use the `playwright` tool to view the page, and you can use the `figma-dev-mode-mcp-server` tool to interact with mockups.

The top tabs allow migrating between different starting states for the app, but there should be a shared app shell and functionality that looks like a mockup you'd take a screenshot in the area below.

The navigation header (Home, Posts, Users) in \_\_root.tsx should be kept - it's used to manage various UI states and variations.

# Important checklist for development

- When using images ALWAYS use the canonical version from Figma, do not use packages like lucide-react without consulting first
- Inside of the Firefox UI, ALWAYS use components from Figma (or if existing from `src/components/firefox`). NEVER use the shadcn components in src/components/ui, those are only for the surrounding UI.
- After finishing work, run `npm run check` to ensure code passes all linting, formatting, and type checking.
- Make sure `npm run test` passes. Prefer to write unit tests when possible.

# Debugging Tips

- When debugging local page loading, use Test Page instead of Firefox Wikipedia
