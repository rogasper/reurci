import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@reurci/api/context";
import { appRouter } from "@reurci/api/routers/index";
import { auth } from "@reurci/auth";
import { env } from "@reurci/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { aiPingRoutes } from "./routes/ai-ping";
import { aiTailorRoutes } from "./routes/ai-tailor";
import { aiParseCvRoutes } from "./routes/ai-parse-cv";

const app = new Hono();

app.use(logger());
app.use("/*", cors({
  origin: env.CORS_ORIGIN,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.use("/trpc/*", trpcServer({ router: appRouter, createContext: (_opts, context) => createContext({ context }) }));

app.route("/api/ai", aiPingRoutes);
app.route("/api/ai/tailor", aiTailorRoutes);
app.route("/api/ai/parse-cv", aiParseCvRoutes);

app.get("/", (c) => c.text("OK"));

const port = Number(new URL(env.BETTER_AUTH_URL).port) || 3000;
console.log(`Server: http://localhost:${port}`);

Bun.serve({ fetch: app.fetch, port, idleTimeout: 255 });
