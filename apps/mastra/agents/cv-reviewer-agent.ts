import { Agent } from "@mastra/core/agent";
import { env } from "@reurci/env/server";
import { sumopod } from "../model";

export const cvReviewerAgent = new Agent({
  id: "cv-reviewer-agent",
  name: "CV Reviewer Agent",
  instructions: `You review CVs and resumes against industry best practices.
Use the cv-reviewer skill to run a comprehensive checklist and provide
structured, severity-tiered feedback with actionable suggestions.
Adapt feedback based on the candidate's experience level.`,
  model: sumopod.chat(env.SUMOPOD_DEFAULT_MODEL),
  skills: ["./skills/cv-reviewer"],
});
