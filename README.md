# React FX Mockup

A React application for creating Firefox UI mockups.

## Development

### Code Quality Tools

This project includes strict linting, type checking, and formatting:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured with strict TypeScript rules and React best practices
- **Prettier**: Automatic code formatting with consistent style
- **Husky + lint-staged**: Pre-commit hooks to ensure code quality

### Available Scripts

```bash
# Development
npm run dev          # Start development server

# Code Quality
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors automatically
npm run format       # Format all files with Prettier
npm run format:check # Check if files are formatted
npm run typecheck    # Run TypeScript type checking
npm run check        # Run all checks (typecheck, lint, format:check)

# Build & Deploy
npm run build        # Build for production
npm run deploy       # Deploy to Cloudflare Workers
```

### Pre-commit Hooks

When you commit, the following checks run automatically:

- ESLint fixes for staged TypeScript files
- Prettier formatting for all staged files

To bypass hooks in emergency (not recommended):

```bash
git commit --no-verify
```

### Getting Started

From your terminal:

```sh
npm install
npm run dev
```

This starts your app in development mode at `http://localhost:3000`, rebuilding assets on file changes.
