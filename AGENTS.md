# AGENTS.md

This document provides guidelines for agentic coding agents operating in this repository.

## Project Overview

A React Router v7 application deployed on Cloudflare Pages/Workers with TypeScript, Tailwind CSS v4, and MDX blog support.

## Build Commands

| Command | Description |
|---------|-------------|
| `bun run build` | Build for production (`react-router build`) |
| `bun run dev` | Start dev server with HMR (`react-router dev`, port 5173) |
| `bun run preview` | Preview production build locally (`vite preview`) |
| `bun run deploy` | Build and deploy to Cloudflare (`bun run build && wrangler deploy`) |
| `bun run typecheck` | Full type checking: generates Cloudflare types, react-router types, then runs tsc |
| `bun run cf-typegen` | Generate Cloudflare bindings types (`wrangler types`) |

**Single test command**: This project has no test suite. If adding tests, use Vitest and place tests alongside source files with `.test.ts` or `.test.tsx` extension.

## TypeScript Configuration

- **Strict mode enabled**: All strict flags are on
- **Module syntax**: `verbatimModuleSyntax` requires explicit `import type` usage
- **Paths**: `@/*` maps to `./app/*` (use this alias for all app imports)
- **Target**: ES2022 with DOM types
- **Type assertions**: Use `satisfies` for type narrowing, avoid `as any`
- **Generated types**: React Router generates route types in `.react-router/types/`

## Code Style Guidelines

### Imports

```typescript
// Correct
import { type RouteConfig, index, route } from "@react-router/dev/routes";
import type { Route } from "./+types/root";
import { cn } from "@/lib/utils";

// Incorrect
import { RouteConfig, index, route } from "@react-router/dev/routes";
```

- Use explicit `import type` when only importing types
- Use `@/` alias for app-relative imports
- Group imports: external → alias → relative

### Component Naming & Files

- **Components**: PascalCase (`Button.tsx`, `NavigationMenu.tsx`)
- **Route files**: kebab-case with `$` for dynamic segments (`blog.$slug.tsx`, `home.tsx`)
- **Utility files**: kebab-case or snake_case (`utils.ts`, `lib/utils.ts`)
- **UI components**: Located in `@/components/ui/` (shadcn/ui pattern)

### Tailwind CSS

- Use CSS variables from `app/app.css` for colors, radius, fonts
- Pattern: `className={cn("base-classes", condition && "conditional-classes")}`
- Use `cn()` utility from `@/lib/utils` to merge classes
- Use `tw-animate-css` for animations (e.g., `animate-pulse`, `transition-all`)
- Dark mode: Use `dark:` prefix (custom variant configured)

### Class Variance Authority

Use CVA for component variants:

```typescript
const buttonVariants = cva("base classes...", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { default: "...", sm: "...", lg: "...", icon: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

### React Router Patterns

**Routes** (`app/routes.ts`):
```typescript
export default [
  index("routes/home.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
] satisfies RouteConfig;
```

**Loaders**:
```typescript
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  // ... logic
  return { data };
}
```

**Meta**:
```typescript
export function meta() {
  return [{ title: "Page Title" }, { name: "description", content: "..." }];
}
```

**Error Boundary**:
```typescript
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // Handle route errors
}
```

### Client Components

Add `"use client"` directive at the very top of client-only files:

```typescript
"use client";

import { motion } from "motion/react";
// ...
```

### Error Handling

- Never use empty catch blocks: `catch { }` or `catch (e) {}` → log or handle
- Use try/catch in loaders for external fetches
- Check `isRouteErrorResponse(error)` in error boundaries

### File Structure

```
app/
├── components/
│   ├── ui/          # shadcn/ui components
│   └── ...
├── routes/          # Page components
│   ├── home.tsx
│   ├── about.tsx
│   ├── blog.tsx
│   └── blog.$slug.tsx
├── lib/             # Utilities (utils.ts)
├── root.tsx         # App shell + error boundary
├── entry.server.tsx
└── app.css          # Tailwind + CSS variables
workers/
└── app.ts           # Worker entry point
```

## Linting & Formatting

- **No ESLint/Prettier configured** — write clean code matching existing patterns
- **Run diagnostics**: Use `lsp_diagnostics` before committing
- **Type checking**: Run `bun run typecheck` before creating PRs

## External Dependencies

- **React Router v7** — routing and data loading
- **Cloudflare** — deployment target (Vite plugin, Wrangler)
- **Tailwind CSS v4** — styling
- **MDX** — blog content (remark plugins: frontmatter, gfm)
- **Framer Motion** — animations (`motion/react`)
- **Radix UI** — accessible primitives
- **Lucide React** — icons
- **shadcn/ui** — component pattern

## Cloudflare-Specific

- Worker entry: `workers/app.ts`
- Config: `wrangler.jsonc`
- Generated types: `worker-configuration.d.ts`
- Run `bun run cf-typegen` after adding bindings

## Key Conventions

1. Use `satisfies` for type assertions
2. Use `cn()` for Tailwind class merging
3. Use `"use client"` for client-only components
4. Use `type` imports for types only
5. Define error boundaries for all routes
6. Use CSS variables for theming
7. Name route files with `$` prefix for dynamic segments
