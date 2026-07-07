import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { env } from "@reurci/env/server";
import { sumopod } from "../model";

export const tailorAgent = new Agent({
  id: "tailor-agent",
  name: "Tailor Agent",
  instructions: `You are a CV tailoring assistant for REURCI (Rearrange Your CV).
You help users rephrase their experience achievements and generate professional
summaries tailored to specific job descriptions.

Rules:
- Only rephrase from given source text — never invent new achievements
- Never fabricate skills, roles, or experiences the user doesn't have
- Keep dates and durations exactly as provided
- Use professional, ATS-friendly language`,
  model: sumopod(env.SUMOPOD_DEFAULT_MODEL) as any,
  memory: new Memory({
    options: {
      lastMessages: 10,
      workingMemory: { enabled: true },
    },
  }),
});
