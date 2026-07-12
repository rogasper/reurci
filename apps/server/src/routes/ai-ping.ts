import { Hono } from "hono";
import { z } from "zod";
import { callAndParse } from "@reurci/mastra";

export const aiPingRoutes = new Hono();

aiPingRoutes.post("/ping", async (c) => {
  try {
    const result = await callAndParse(
      z.object({ reply: z.string() }),
      "Output only valid JSON with a reply field. No extra text.",
      "Return exactly this JSON: {\"reply\": \"pong from REURCI AI\"}",
      200,
      { temperature: 0 },
    );
    return c.json({ text: result.reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI service unavailable";
    return c.json({ text: msg }, 500);
  }
});
