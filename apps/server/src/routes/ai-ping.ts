import { Hono } from "hono";
import { mastra } from "@reurci/mastra";

export const aiPingRoutes = new Hono();

aiPingRoutes.post("/ping", async (c) => {
  const agent = mastra.getAgent("tailorAgent");
  const result = await agent.generate("Reply with exactly: pong from REURCI AI");
  return c.json({ text: result.text });
});
