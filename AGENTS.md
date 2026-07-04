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
│   │   └── workflows/   # Workflow definitions
│   ├── web/             # Frontend (React + TanStack Start)
│   └── server/          # Backend API (Hono + tRPC)
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

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Skills Discovery](https://mastra.ai/.well-known/skills/index.json)
