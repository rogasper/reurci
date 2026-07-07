# REURCI — Rearrange Your CV

**REURCI** (Rearrange Your CV) is an open-source CV tailoring assistant. Paste a job description, and REURCI helps you rephrase your experiences, select relevant skills, and generate a tailored CV — all with human-in-the-loop control.

Built with [TanStack Start](https://tanstack.com/start), [Mastra](https://mastra.ai), [Hono](https://hono.dev), and [shadcn/ui](https://ui.shadcn.com/).

## Features

- **AI-powered CV tailoring** — Paste a JD → AI generates 3 summary variants and paraphrases each experience
- **Human-in-the-loop** — Choose, edit, or regenerate each section. Nothing is final until you save.
- **CV versioning** — Save snapshots, re-edit them later, track your history
- **Privacy-first** — Personal info (name, email, phone, LinkedIn) is encrypted and stored only in your browser
- **ATS scoring** — Rules-based score shows how well your CV matches the JD
- **PDF export** — One-click download with ATS-friendly Helvetica format
- **CV import** — Upload existing PDF/DOCX → AI extracts structured data
- **BYOK** — Bring your own API key. Defaults to any OpenAI-compatible provider.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | TanStack Start, shadcn/ui, Tailwind CSS, @ai-sdk/react |
| Backend | Hono, tRPC, Drizzle ORM, PostgreSQL |
| AI | Mastra (agentic framework), OpenAI-compatible API |
| Bundle | Bun, Turborepo |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- [Podman](https://podman.io) or Docker (for PostgreSQL + pgvector)
- An OpenAI-compatible API key (default: [Sumopod](https://sumopod.com), or bring your own)

### Setup

```bash
# Clone & install
git clone https://github.com/your-username/reurci
cd reurci
bun install

# Set up environment
cp .env.example apps/server/.env
# Edit apps/server/.env → set SUMOPOD_API_KEY=your-key

# Start database
bun run db:start
bun run db:init   # enables pgvector extension
bun run db:push   # applies schema

# Start development
bun run dev
```

Web: [http://localhost:3001](http://localhost:3001)  
API: [http://localhost:3000](http://localhost:3000)

### Bring Your Own Key (BYOK)

Set these environment variables in `apps/server/.env`:

```env
SUMOPOD_API_KEY=your-sumopod-key
SUMOPOD_BASE_URL=https://ai.sumopod.com/v1
SUMOPOD_DEFAULT_MODEL=deepseek-v4-pro
```

To use a different provider, override the base URL:

```env
# Example: OpenRouter
SUMOPOD_BASE_URL=https://openrouter.ai/api/v1
SUMOPOD_DEFAULT_MODEL=openai/gpt-4o-mini
```

## Available Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start all apps in development mode (turbo) |
| `bun run dev:web` | Start only the web app (port 3001) |
| `bun run dev:server` | Start only the API server (port 3000) |
| `bun run build` | Build all apps |
| `bun run check-types` | TypeScript type checking |
| `bun run db:push` | Apply Drizzle schema changes |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:start` | Start PostgreSQL via Podman/Docker |

## Architecture

```
apps/
├── web/        # Frontend (TanStack Start + shadcn/ui)
├── server/     # API (Hono + tRPC + Mastra)
└── mastra/     # AI agents, tools, workflows
packages/
├── ui/         # Shared shadcn/ui components
├── api/        # tRPC routers & context
├── auth/       # Better-Auth config
├── db/         # Drizzle ORM + pgvector
├── env/        # Zod-validated env vars
└── config/     # Shared TS config
```

## Design

The UI follows the **Portrait** design system — a warm, light-themed scrapbook aesthetic with Portrait Ink (#08304c) text, white canvas, pastel washes for accents, and generous border radii (cards 24px, buttons 28px). See `DESIGN.md` for the full design system.

## License

MIT — see [LICENSE](LICENSE)
