import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@reurci/api/context";
import { appRouter } from "@reurci/api/routers/index";
import { auth } from "@reurci/auth";
import { env } from "@reurci/env/server";
import { mastra } from "@reurci/mastra";
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

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
