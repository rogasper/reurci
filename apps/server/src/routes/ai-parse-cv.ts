import { Hono } from "hono";
import { parseCV } from "@reurci/mastra";
import { parseCache, simpleHash } from "../lib/cache";

export const aiParseCvRoutes = new Hono();

aiParseCvRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const rawText = String(body.rawText);
  const hash = simpleHash(rawText.slice(0, 5000));
  const cached = parseCache.get(hash);
  if (cached?.status === "done") return cached.error ? c.json({ error: cached.error }, 500) : c.json(cached.result);
  if (cached?.status === "running") return c.json({ status: "running", hash });
  parseCache.set(hash, { status: "running" });
  try {
    const result = await parseCV(rawText);
    parseCache.set(hash, { status: "done", result });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    parseCache.set(hash, { status: "done", error: message });
    throw err;
  }
});

aiParseCvRoutes.get("/status/:hash", async (c) => {
  const cached = parseCache.get(c.req.param("hash"));
  if (!cached) return c.json({ error: "not_found" }, 404);
  if (cached.status === "running") return c.json({ status: "running" });
  if (cached.error) return c.json({ error: cached.error }, 500);
  return c.json(cached.result);
});
