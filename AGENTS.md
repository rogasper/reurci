# AGENTS.md

## CRITICAL: Load `mastra` skill first

Load the `mastra` skill BEFORE any Mastra work. Never rely on cached knowledge — APIs change between versions.

## Project Structure

This is a **Bun + Turborepo monorepo** bootstrapped with [Better-T-Stack](https://www.better-t-stack.dev/).

```
reurci/
├── apps/
│   ├── mastra/          # Mastra AI agents, tools, workflows
│   │   ├── index.ts     # Mastra instance — register all agents, workflows here
│   │   ├── agents/      # Agent definitions
│   │   ├── tools/       # Custom tools
│   │   ├── workflows/   # Workflow definitions
│   │   ├── lib/         # Shared utilities (ai-utils, anti-fabrikasi)
│   │   └── model.ts     # AI SDK provider config (sumopod via @ai-sdk/openai)
│   ├── web/             # Frontend (React + TanStack Start)
│   │   └── src/
│   │       ├── hooks/   # Custom React hooks (use-tailor)
│   │       ├── types/   # Shared TypeScript types (tailor)
│   │       └── utils/   # Storage & API helpers (storage.ts)
│   └── server/          # Backend API (Hono + tRPC)
│       └── src/
│           ├── routes/  # API route files by domain (ai-ping, ai-tailor, ai-parse-cv)
│           └── lib/     # Cache & shared utilities (cache.ts)
├── packages/
│   ├── ui/              # Shared shadcn/ui components
│   ├── api/             # tRPC routers and context
│   ├── auth/            # Better-Auth configuration
│   ├── db/              # Drizzle ORM schema and migrations
│   ├── env/             # Environment variable validation (zod)
│   └── config/          # Shared TypeScript config (tsconfig.base.json)
```

## Mastra Rules

- Mastra is **served from `apps/server`** via `@mastra/ai-sdk` (not as a standalone dev server)
- Register all agents and workflows in `apps/mastra/index.ts`
- Place agents in `apps/mastra/agents/`, tools in `apps/mastra/tools/`, workflows in `apps/mastra/workflows/`
- Use `bun run dev` (runs `turbo run dev`) for local development
- Set `SUMOPOD_API_KEY` in `apps/server/.env` (see `.env.example`)
- Mastra dependencies (`mastra`, `@mastra/core`, `@mastra/memory`, etc.) live in the **root** `package.json`
- The `@reurci/mastra` workspace package exports the Mastra instance consumed by `apps/server`
- AI calls use `callAndParse()` from `apps/mastra/lib/ai-utils.ts` — never raw `fetch` or `generateObject`
- Provider configured in `apps/mastra/model.ts` via `createOpenAI({ baseURL, apiKey })` using `@ai-sdk/openai`

## Server API Routes

- Routes organized in `apps/server/src/routes/` by domain: `ai-ping.ts`, `ai-tailor.ts`, `ai-parse-cv.ts`
- `apps/server/src/index.ts` composes routes via `app.route("/api/ai", aiTailorRoutes)` pattern
- Cache utilities (`simpleHash`, `tailorCache`, `parseCache`) in `apps/server/src/lib/cache.ts`

## Web Frontend Rules

- State management via custom hooks in `apps/web/src/hooks/` (e.g. `use-tailor.ts`)
- Shared TypeScript types in `apps/web/src/types/` (e.g. `tailor.ts` for Variant, Pii, ExpEntry, TailorState)
- Storage/API helpers in `apps/web/src/utils/storage.ts`: `ls()` (load state), `ss()` (save state), `apiPost()` (server calls)
- Components in `apps/web/src/components/tailor/` for accordion sections, variant cards, etc.
- API calls use `apiPost()` from `utils/storage.ts` — never raw `fetch` in components
- Session storage keyed by `"reurci:tailor-state"` for page refresh persistence

## Design System

- **All UI must follow `DESIGN.md`** — the Portrait theme defines colors, typography, spacing, border radii, shadows, and elevation
- **Colors:** Portrait Ink `#08304c` for text/lines, white canvas for backgrounds, pastel washes for accents (mint `#d7ffe2`, sky `#e8f1ff`, peach `#ffebd6`)
- **Fonts:** Switzer (body/UI 10-24px), Basier Circle fallback (headings 31px+)
- **Radii:** cards 24px, buttons 28px, inputs 16px, tags 9999px
- **Buttons:** `outline` (visible border), `ghost` (transparent + hover), `secondary` (sky-wash), `rainbow` (one CTA per view with 1.5px rainbow gradient border)
- **Shadows:** soft multi-layer at max 3-8% opacity + 1px oklab hairline
- **Theme:** light only — no dark mode

## Drizzle ORM Dependency Rules

- `drizzle-orm` is owned by **`@reurci/db`** only — no other package installs it
- Helpers like `eq`, `sql`, `desc`, `and`, `or`, `asc`, `like`, `inArray`, `isNull`, `isNotNull` are re-exported from `@reurci/db`
- Any file needing these imports `from "@reurci/db"` — never `from "drizzle-orm"`
- The `db` instance (drizzle client) is also exported from `@reurci/db`
- Schema tables are imported `from "@reurci/db/schema/<table>"`

```
// ✅ Correct
import { db, eq, sql } from "@reurci/db";
import { experience } from "@reurci/db/schema/experiences";

// ❌ Wrong — never import drizzle-orm directly
import { eq, sql } from "drizzle-orm";
```

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Skills Discovery](https://mastra.ai/.well-known/skills/index.json)
