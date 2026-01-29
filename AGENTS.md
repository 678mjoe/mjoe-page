# AGENTS.md

Guidelines for agentic coding agents operating in this repository.

## Project Overview

React Router v7 application on Cloudflare Pages/Workers with TypeScript, Tailwind CSS v4, and MDX blog.

## Build Commands

| Command | Description |
|---------|-------------|
| `bun run build` | Build for production |
| `bun run dev` | Start dev server (port 5173) |
| `bun run preview` | Preview production build |
| `bun run deploy` | Build and deploy to Cloudflare |
| `bun run typecheck` | Full type checking |
| `bun run cf-typegen` | Generate Cloudflare types |

**Note**: No test suite. Use Vitest with `.test.ts`/`.test.tsx` if adding tests.

## TypeScript Configuration

- Strict mode enabled with `verbatimModuleSyntax` (requires explicit `import type`)
- `@/*` maps to `./app/*`
- Target: ES2022, use `satisfies` for type assertions
- Route types generated in `.react-router/types/`

## Code Style

### Imports

```typescript
import { type RouteConfig, index, route } from "@react-router/dev/routes";
import type { Route } from "./+types/root";
import { cn } from "@/lib/utils";
```

Use `import type` for types only, `@/` alias for app-relative imports.

### Naming

- Components: PascalCase (`Button.tsx`)
- Routes: kebab-case with `$` for dynamic segments (`blog.$slug.tsx`)
- Utilities: kebab-case (`utils.ts`)

### Tailwind CSS

Use CSS variables from `app/app.css`, `cn()` utility for merging, `dark:` prefix for dark mode, and `tw-animate-css` for animations.

### CVA Pattern

```typescript
const buttonVariants = cva("base classes...", {
  variants: { variant: { default: "..." }, size: { default: "..." } },
  defaultVariants: { variant: "default", size: "default" },
});
```

### React Router

**Routes** (`app/routes.ts`):
```typescript
export default [
  index("routes/home.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
] satisfies RouteConfig;
```

**Loaders**:
```typescript
export async function loader({ params }: { params: { slug: string } }) {
  const module = getPost(params.slug);
  if (!module) throw new Response("Not Found", { status: 404 });
  return { frontmatter: module.frontmatter };
}
```

**Meta**:
```typescript
export function meta({ loaderData }: { loaderData: { frontmatter: Frontmatter } }) {
  return [{ title: loaderData.frontmatter.title }];
}
```

**Error Boundary**:
```typescript
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) return <h1>{error.status === 404 ? "Not Found" : "Error"}</h1>;
  return <h1>Oops!</h1>;
}
```

### Client Components

Add `"use client"` directive at the top for animations/interactivity:
```typescript
"use client";
import { motion } from "motion/react";
```

### Error Handling

- Never empty catch blocks
- Use try/catch in loaders for external fetches
- Throw `Response` with status for 404s
- Check `isRouteErrorResponse(error)` in error boundaries

### MDX Blog

- Content: `app/content/*.mdx`
- Frontmatter: `title`, `date`, `excerpt?`, `category: "essay" | "tech"`
- Load with `import.meta.glob` (see `app/lib/posts.ts`)

## File Structure

```
app/
├── components/ui/    # shadcn/ui components
├── content/          # MDX posts
├── lib/              # Utilities
├── routes/           # Pages
├── root.tsx          # App shell
├── app.css           # Tailwind
└── routes.ts         # Route config
workers/
└── app.ts            # Worker entry
```

## Linting

No ESLint/Prettier configured. Use `lsp_diagnostics` before committing, run `bun run typecheck` before PRs.

## Dependencies

- React Router v7, Cloudflare, Tailwind CSS v4, MDX, motion/react, shadcn/ui

## Cloudflare

- Worker: `workers/app.ts`
- Config: `wrangler.jsonc`
- Types: `worker-configuration.d.ts`
- Run `bun run cf-typegen` after adding bindings

## Key Conventions

1. Use `satisfies` for type assertions
2. Use `cn()` for Tailwind merging
3. Use `"use client"` for client components
4. Use `type` imports for types only
5. Define error boundaries for routes
6. Name route files with `$` for dynamic segments
