import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@reurci/api/context";
import { appRouter } from "@reurci/api/routers/index";
import { auth } from "@reurci/auth";
import { env } from "@reurci/env/server";
import { mastra } from "@reurci/mastra";
import { streamSSE } from "hono/streaming";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.post("/api/ai/ping", async (c) => {
  const agent = mastra.getAgent("tailorAgent");
  const result = await agent.generate("Reply with exactly: pong from REURCI AI");
  return c.json({ text: result.text });
});

app.post("/api/ai/tailor/fast", async (c) => {
  const body = await c.req.json();
  const jobDescription = String(body.jobDescription);
  const userId = String(body.userId);

  const workflow = mastra.getWorkflow("tailorCvWorkflow");
  const run = await workflow.createRun();
  const result = await run.start({ inputData: { jobDescription, userId } });

  return c.json(result);
});

app.post("/api/ai/tailor/summary", async (c) => {
  const body = await c.req.json();
  const { generateSummaryVariants } = await import("@reurci/mastra");
  const result = await generateSummaryVariants(String(body.jd), body.profile || { experiences: [], skills: [] });
  return c.json(result);
});

app.post("/api/ai/tailor/experience", async (c) => {
  const body = await c.req.json();
  const { generateExperienceVariants } = await import("@reurci/mastra");
  const result = await generateExperienceVariants(String(body.jd), body.experience, body.customContext);
  return c.json(result);
});

app.post("/api/ai/tailor/skills", async (c) => {
  const body = await c.req.json();
  const { scoreSkillsAgainstJd } = await import("@reurci/mastra");
  const result = await scoreSkillsAgainstJd(String(body.jd), body.skills || []);
  return c.json(result);
});

app.post("/api/ai/tailor/regenerate", async (c) => {
  const body = await c.req.json();
  const { regenerateVariants } = await import("@reurci/mastra");
  const result = await regenerateVariants(String(body.jd), String(body.section), String(body.current), String(body.customContext));
  return c.json(result);
});

app.post("/api/ai/tailor/relevance", async (c) => {
  const body = await c.req.json();
  const { analyzeRelevance } = await import("@reurci/mastra");
  const result = await analyzeRelevance(String(body.jd), body.experiences || []);
  return c.json(result);
});

app.post("/api/ai/tailor/generate-from-context", async (c) => {
  const body = await c.req.json();
  const { generateFromContext } = await import("@reurci/mastra");
  const result = await generateFromContext(String(body.jd), String(body.userContext));
  return c.json(result);
});

app.post("/api/ai/tailor/start", async (c) => {
  const body = await c.req.json();
  const jobDescription = String(body.jobDescription ?? "");
  const userId = String(body.userId ?? "");

  if (!jobDescription || !userId) {
    return c.json({ error: "Missing jd or uid" }, 400);
  }

  const hash = simpleHash(`tailor:${jobDescription.slice(0, 500)}:${userId}`);

  const existing = tailorCache.get(hash);
  if (existing?.status === "done") return c.json({ hash, cached: true });
  if (existing?.status === "running") return c.json({ hash, running: true });

  tailorCache.set(hash, { status: "pending", jobDescription, userId });
  return c.json({ hash });
});

app.get("/api/ai/tailor/stream", async (c) => {
  const hash = c.req.query("hash") ?? "";

  if (!hash) {
    return c.json({ error: "Missing hash query param" }, 400);
  }

  const cached = tailorCache.get(hash);
  if (!cached) {
    return c.json({ error: "not_found" }, 404);
  }

  if (!cached.jobDescription || !cached.userId) {
    return c.json({ error: "Invalid cache entry" }, 500);
  }

  const { jobDescription, userId } = cached;

  return streamSSE(c, async (sse) => {
    if (cached.status === "done") {
      if (cached.error) {
        await sse.writeSSE({ event: "error", data: JSON.stringify({ message: cached.error }) });
      } else {
        await sse.writeSSE({ event: "result", data: JSON.stringify(cached.result) });
      }
      return;
    }

    if (cached.status === "running") {
      await sse.writeSSE({ event: "start", data: JSON.stringify({ status: "running", hash }) });
      return;
    }

    tailorCache.set(hash, { status: "running", jobDescription, userId });
    await sse.writeSSE({ event: "start", data: JSON.stringify({ status: "analyzing" }) });

    try {
      const workflow = mastra.getWorkflow("tailorCvWorkflow");
      const run = await workflow.createRun();
      const raw = await run.start({ inputData: { jobDescription, userId } });
      // Extract actual result from Mastra WorkflowResult envelope
      const result = (raw as any).result ?? raw;
      console.log("[tailor] done, keys:", Object.keys(result ?? {}));

      tailorCache.set(hash, { status: "done", jobDescription, userId, result });
      await sse.writeSSE({ event: "result", data: JSON.stringify(result) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      tailorCache.set(hash, { status: "done", jobDescription, userId, error: message });
      await sse.writeSSE({ event: "error", data: JSON.stringify({ message }) });
    }
  });
});

// ── Parse CV cache (survives page refresh) ────────────────
const tailorCache = new Map<string, { status: "pending" | "running" | "done"; jobDescription?: string; userId?: string; result?: unknown; error?: string }>();
const parseCache = new Map<string, { status: "running" | "done"; result?: unknown; error?: string }>();

function simpleHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

app.post("/api/ai/parse-cv", async (c) => {
  const body = await c.req.json();
  const rawText = String(body.rawText);
  const hash = simpleHash(rawText.slice(0, 5000));

  const cached = parseCache.get(hash);
  if (cached?.status === "done") {
    if (cached.error) return c.json({ error: cached.error }, 500);
    return c.json(cached.result);
  }

  if (cached?.status === "running") {
    return c.json({ status: "running", hash });
  }

  parseCache.set(hash, { status: "running" });

  try {
    const { parseCV } = await import("@reurci/mastra");
    const result = await parseCV(rawText);
    parseCache.set(hash, { status: "done", result });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    parseCache.set(hash, { status: "done", error: message });
    throw err;
  }
});

app.get("/api/ai/parse-cv/status/:hash", async (c) => {
  const hash = c.req.param("hash");
  const cached = parseCache.get(hash);

  if (!cached) return c.json({ error: "not_found" }, 404);
  if (cached.status === "running") return c.json({ status: "running" });
  if (cached.error) return c.json({ error: cached.error }, 500);
  return c.json(cached.result);
});

app.get("/api/ai/tailor/status/:hash", async (c) => {
  const hash = c.req.param("hash");
  const cached = tailorCache.get(hash);

  if (!cached) return c.json({ error: "not_found" }, 404);
  if (cached.status === "running") return c.json({ status: "running" });
  if (cached.error) return c.json({ error: cached.error }, 500);
  return c.json(cached.result);
});

app.get("/", (c) => {
  return c.text("OK");
});

const port = new URL(env.BETTER_AUTH_URL).port || "3000";
console.log(`Server running on http://localhost:${port}`);

Bun.serve({
  fetch: app.fetch,
  port: Number(port),
  idleTimeout: 255,
});
