import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@reurci/env/server";

export const sumopod = createOpenAI({
  baseURL: env.SUMOPOD_BASE_URL,
  apiKey: env.SUMOPOD_API_KEY,
});
