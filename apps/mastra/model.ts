import { env } from "@reurci/env/server";

export const sumopodModel = {
  providerId: "sumopod",
  modelId: env.SUMOPOD_DEFAULT_MODEL,
  url: env.SUMOPOD_BASE_URL,
  apiKey: env.SUMOPOD_API_KEY,
} as const;
