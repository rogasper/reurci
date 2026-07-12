import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { mastra, generateSummaryVariants, generateExperienceVariants, scoreSkillsAgainstJd, regenerateVariants, analyzeRelevance, generateFromContext, generateCoverLetter, reviewCv, categorizeSkills, scoreProjectsAgainstJd, generateJobTitle } from "@reurci/mastra";
import { tailorCache, simpleHash } from "../lib/cache";
import { db, eq } from "@reurci/db";
import { skillCategory } from "@reurci/db/schema/skill_categories";

export const aiTailorRoutes = new Hono();

// Non-streaming fast endpoint
aiTailorRoutes.post("/fast", async (c) => {
  const body = await c.req.json();
  const workflow = mastra.getWorkflow("tailorCvWorkflow");
  const run = await workflow.createRun();
  const result = await run.start({ inputData: { jobDescription: String(body.jobDescription), userId: String(body.userId) } });
  return c.json(result);
});

// Start → get hash
aiTailorRoutes.post("/start", async (c) => {
  const body = await c.req.json();
  const jd = String(body.jobDescription ?? ""); const uid = String(body.userId ?? "");
  if (!jd || !uid) return c.json({ error: "Missing jd or uid" }, 400);
  const hash = simpleHash(`tailor:${jd.slice(0, 500)}:${uid}`);
  const cached = tailorCache.get(hash);
  if (cached?.status === "done") return c.json({ hash, cached: true });
  if (cached?.status === "running") return c.json({ hash, running: true });
  tailorCache.set(hash, { status: "pending", jobDescription: jd, userId: uid });
  return c.json({ hash });
});

// SSE stream
aiTailorRoutes.get("/stream", async (c) => {
  const hash = c.req.query("hash") ?? "";
  if (!hash) return c.json({ error: "Missing hash" }, 400);
  const cached = tailorCache.get(hash);
  if (!cached || !cached.jobDescription || !cached.userId) return c.json({ error: "not_found" }, 404);
  const { jobDescription, userId } = cached;

  return streamSSE(c, async (sse) => {
    const check = tailorCache.get(hash);
    if (check?.status === "done") {
      await sse.writeSSE({ event: check.error ? "error" : "result", data: JSON.stringify(check.error ? { message: check.error } : check.result) });
      return;
    }
    if (check?.status === "running") { await sse.writeSSE({ event: "start", data: JSON.stringify({ status: "running", hash }) }); return; }
    tailorCache.set(hash, { status: "running", jobDescription, userId });
    await sse.writeSSE({ event: "start", data: JSON.stringify({ status: "analyzing" }) });
    try {
      const workflow = mastra.getWorkflow("tailorCvWorkflow");
      const raw = await workflow.createRun().then((r) => r.start({ inputData: { jobDescription, userId } }));
      const result = (raw as any).result ?? raw;
      tailorCache.set(hash, { status: "done", jobDescription, userId, result });
      await sse.writeSSE({ event: "result", data: JSON.stringify(result) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      tailorCache.set(hash, { status: "done", jobDescription, userId, error: msg });
      await sse.writeSSE({ event: "error", data: JSON.stringify({ message: msg }) });
    }
  });
});

// Status by hash
aiTailorRoutes.get("/status/:hash", async (c) => {
  const cached = tailorCache.get(c.req.param("hash"));
  if (!cached) return c.json({ error: "not_found" }, 404);
  if (cached.status === "running") return c.json({ status: "running" });
  if (cached.error) return c.json({ error: cached.error }, 500);
  return c.json(cached.result);
});

// Wizard step endpoints
aiTailorRoutes.post("/summary", async (c) => {
  const body = await c.req.json();
  const result = await generateSummaryVariants(String(body.jd), body.profile || { experiences: [], skills: [] });
  return c.json(result);
});

aiTailorRoutes.post("/experience", async (c) => {
  const body = await c.req.json();
  const result = await generateExperienceVariants(String(body.jd), body.experience, body.customContext);
  return c.json(result);
});

aiTailorRoutes.post("/skills", async (c) => {
  const body = await c.req.json();
  const result = await scoreSkillsAgainstJd(String(body.jd), body.skills || []);
  return c.json(result);
});

aiTailorRoutes.post("/regenerate", async (c) => {
  const body = await c.req.json();
  const result = await regenerateVariants(String(body.jd), String(body.section), String(body.current), String(body.customContext));
  return c.json(result);
});

aiTailorRoutes.post("/relevance", async (c) => {
  const body = await c.req.json();
  const result = await analyzeRelevance(String(body.jd), body.experiences || []);
  return c.json(result);
});

aiTailorRoutes.post("/generate-from-context", async (c) => {
  const body = await c.req.json();
  const result = await generateFromContext(String(body.jd), String(body.userContext));
  return c.json(result);
});

aiTailorRoutes.post("/cover-letter", async (c) => {
  const body = await c.req.json();
  const result = await generateCoverLetter(String(body.jd), body.cvSnapshot || {});
  return c.json(result);
});

aiTailorRoutes.post("/review-cv", async (c) => {
  const body = await c.req.json();
  const result = await reviewCv(String(body.cvText));
  return c.json(result);
});

aiTailorRoutes.post("/categorize-skills", async (c) => {
  const body = await c.req.json();
  const items: { id: string; name: string }[] = body.skills || [];

  const cacheEntries = await db.select().from(skillCategory);
  const known: Record<string, string> = {};
  for (const entry of cacheEntries) {
    known[entry.name.toLowerCase()] = entry.category;
  }

  const unknown = items.filter(i => !known[i.name.toLowerCase()]);
  const aiResult = unknown.length > 0 ? await categorizeSkills(items, known) : { skills: [], newCategories: [] };

  for (const s of aiResult.skills) {
    const key = s.name.toLowerCase();
    const existing = cacheEntries.find(e => e.name.toLowerCase() === key);
    if (existing) {
      await db.update(skillCategory).set({ confidence: existing.confidence + 1 }).where(eq(skillCategory.id, existing.id));
    } else {
      await db.insert(skillCategory).values({ name: s.name, category: s.category });
    }
    known[key] = s.category;
  }

  const merged = items.map(i => ({ id: i.id, name: i.name, category: known[i.name.toLowerCase()] ?? "" }));
  return c.json({ skills: merged, newCategories: aiResult.newCategories ?? [] });
});

aiTailorRoutes.post("/project-relevance", async (c) => {
  const body = await c.req.json();
  const result = await scoreProjectsAgainstJd(String(body.jd), body.projects || []);
  return c.json(result);
});

aiTailorRoutes.post("/generate-title", async (c) => {
  const body = await c.req.json();
  const title = await generateJobTitle(String(body.jd), body.experiences || []);
  return c.json({ title });
});
