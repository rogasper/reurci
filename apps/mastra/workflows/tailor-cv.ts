import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { db } from "@reurci/db";
import { generateEmbedding } from "../tools/embed";
import { sql } from "@reurci/db";
import { callAndParse } from "../lib/ai-utils";

const jdAnalysisSchema = z.object({
  hardSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  seniority: z.string().transform((s) => {
    const l = s.toLowerCase();
    if (l.includes("exec") || l.includes("c-level")) return "Executive";
    if (l.includes("lead") || l.includes("principal")) return "Lead";
    if (l.includes("senior") || l.includes("sr")) return "Senior";
    if (l.includes("mid") || l.includes("intermediate")) return "Mid";
    if (l.includes("junior") || l.includes("jr") || l.includes("entry")) return "Junior";
    return "Mid";
  }),
  topPriorities: z.array(z.string()),
});

const relevantDataSchema = z.object({
  experiences: z.array(
    z.object({
      id: z.string(),
      company: z.string(),
      role: z.string(),
      periodStart: z.string(),
      periodEnd: z.string().nullable(),
      description: z.string().nullable(),
      achievements: z.array(z.string()),
    }),
  ),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      proficiency: z.number().nullable(),
    }),
  ),
  educations: z.array(
    z.object({
      id: z.string(),
      institution: z.string(),
      degree: z.string().nullable(),
      field: z.string().nullable(),
      yearStart: z.number().nullable(),
      yearEnd: z.number().nullable(),
    }),
  ),
});

const rephrasedSchema = z.object({
  experienceId: z.string().optional().default(""),
  original: z.string(),
  rephrased: z.string(),
}).loose();

const bulletPointsSchema = z.object({
  original: z.string(),
  rephrased: z.string(),
}).loose();

const strategyItemSchema = z.object({
  rank: z.number().optional(),
  focus: z.string().optional(),
  strategy: z.string().optional(),
  summary: z.string().optional().default(""),
  selectedExperienceIds: z.array(z.string()).optional().default([]),
  selectedSkillIds: z.array(z.string()).optional().default([]),
  rephrasedAchievements: z.array(rephrasedSchema).optional().default([]),
  bullet_points: z.array(bulletPointsSchema).optional().default([]),
  selectedExperienceIds_by_strategy: z.array(z.string()).optional(),
  selectedSkillIds_by_strategy: z.array(z.string()).optional(),
}).loose();

const strategiesOutputSchema = z.object({
  strategies: z.array(strategyItemSchema).transform((arr) =>
    arr.map((s, i) => ({
      rank: s.rank ?? i + 1,
      focus: s.focus ?? s.strategy ?? "Strategy " + (i + 1),
      summary: s.summary ?? "",
      selectedExperienceIds: s.selectedExperienceIds_by_strategy ?? s.selectedExperienceIds ?? [],
      rephrasedAchievements:
        s.rephrasedAchievements.length > 0
          ? s.rephrasedAchievements
          : s.bullet_points.map((bp) => ({
              experienceId: "",
              original: bp.original,
              rephrased: bp.rephrased,
            })),
      selectedSkillIds: s.selectedSkillIds_by_strategy ?? s.selectedSkillIds ?? [],
    })),
  ),
}).or(
  z.array(strategyItemSchema).transform((arr) => ({
    strategies: arr.map((s, i) => ({
      rank: s.rank ?? i + 1,
      focus: s.focus ?? s.strategy ?? "Strategy " + (i + 1),
      summary: s.summary ?? "",
      selectedExperienceIds: s.selectedExperienceIds_by_strategy ?? s.selectedExperienceIds ?? [],
      rephrasedAchievements:
        s.rephrasedAchievements.length > 0
          ? s.rephrasedAchievements
          : s.bullet_points.map((bp) => ({
              experienceId: "",
              original: bp.original,
              rephrased: bp.rephrased,
            })),
      selectedSkillIds: s.selectedSkillIds_by_strategy ?? s.selectedSkillIds ?? [],
    })),
  })),
);

// ── Step 1: Analyze JD ────────────────────────────────────
const analyzeJd = createStep({
  id: "analyze-jd",
  description: "Extract hard skills, soft skills, seniority, and priorities from job description",
  inputSchema: z.object({ jobDescription: z.string() }),
  outputSchema: jdAnalysisSchema,
  execute: async ({ inputData }) => {
    return callAndParse(
      jdAnalysisSchema,
      `You analyze job descriptions for CV tailoring.
Extract: hardSkills (technical), softSkills (behavioral), seniority, topPriorities (top 3).
Return JSON. No extra text.`,
      inputData.jobDescription,
      4000,
      { temperature: 0.3 },
    );
  },
});

// ── Step 2: Fetch relevant data from DB ───────────────────
const fetchRelevant = createStep({
  id: "fetch-relevant",
  description: "Load user's experiences, skills, and education from database",
  inputSchema: jdAnalysisSchema,
  outputSchema: relevantDataSchema,
  execute: async ({ getInitData, getStepResult }) => {
    const init = getInitData<{ jobDescription: string; userId: string }>();
    const jd = getStepResult(analyzeJd);
    const userId = init.userId;

    const p = await db.query.profile.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    });
    if (!p) throw new Error("Profile not found");

    const allExp = await db.query.experience.findMany({
      where: (e, { eq }) => eq(e.profileId, p.id),
      orderBy: (e, { desc }) => desc(e.periodStart),
    });

    let selectedExp = allExp;
    if (allExp.length > 5) {
      const jdText = `${jd.hardSkills.join(" ")} ${jd.topPriorities.join(" ")}`;
      const jdEmbedding = await generateEmbedding(jdText);
      const embeddingStr = `[${jdEmbedding.join(",")}]`;
      const result = await db.execute(
        sql`SELECT id, company, role, period_start, period_end, description, achievements
            FROM experience
            WHERE profile_id = ${p.id}
            ORDER BY embedding <-> ${sql.raw(embeddingStr)}::vector
            LIMIT 8`,
      );
      selectedExp = result.rows as unknown as typeof allExp;
    }

    const allSkills = await db.query.skill.findMany({
      where: (s, { eq }) => eq(s.profileId, p.id),
      orderBy: (s) => s.name,
    });

    const allEdu = await db.query.education.findMany({
      where: (e, { eq }) => eq(e.profileId, p.id),
      orderBy: (e, { desc }) => desc(e.yearStart),
    });

    const mapExp = (raw: any) => ({
      id: raw.id,
      company: raw.company,
      role: raw.role,
      periodStart: raw.period_start ?? raw.periodStart ?? "",
      periodEnd: raw.period_end ?? raw.periodEnd ?? null,
      description: raw.description ?? null,
      achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    });

    return {
      experiences: selectedExp.map((e: any) => mapExp(e)),
      skills: allSkills.map((s) => ({ id: s.id, name: s.name, proficiency: s.proficiency })),
      educations: allEdu.map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        yearStart: e.yearStart,
        yearEnd: e.yearEnd,
      })),
    };
  },
});

// ── Step 3: Generate strategies (reduced prompt) ───────────
const generateStrategies = createStep({
  id: "generate-strategies",
  description: "Generate 3 CV tailoring strategies with rephrased achievements",
  inputSchema: relevantDataSchema,
  outputSchema: strategiesOutputSchema,
  execute: async ({ getInitData, getStepResult }) => {
    const init = getInitData<{ jobDescription: string; userId: string }>();
    const jd = getStepResult(analyzeJd);
    const relevant = getStepResult(fetchRelevant);

    // Limit prompt size: 3 exp × 2 achievements × 150-char desc, 8 skills
    const topExp = relevant.experiences.slice(0, 3);
    const experienceText = topExp
      .map(
        (e) =>
          `EXP[${e.id}]: ${e.role} at ${e.company} (${e.periodStart}—${e.periodEnd ?? "Present"}). ${(e.description ?? "").slice(0, 150)}. Ach: ${e.achievements.slice(0, 2).join(" | ")}`,
      )
      .join("\n");

    const topSkills = relevant.skills.slice(0, 8);
    const skillsText = topSkills
      .map((s) => `SKILL[${s.id}]: ${s.name}`)
      .join("\n");

    return callAndParse(
      strategiesOutputSchema,
      `You rewrite CV bullet points and select relevant skills for specific job applications.

CRITICAL:
- ONLY rephrase from given source — NEVER invent
- NEVER change dates, titles, or fabricate
- ATS-friendly, quantify with numbers

Generate 3 strategies: STRONGEST (quantitative), RELEVANCE (closest match), BALANCED (broad).

Return ONLY one of these two exact JSON formats (choose whichever is easier):

Option A: {"strategies": [{"rank":1,"focus":"STRONGEST","summary":"...","selectedExperienceIds":["..."],"rephrasedAchievements":[{"experienceId":"...","original":"...","rephrased":"..."}],"selectedSkillIds":["..."]}]}

Option B: [{"rank":1,"focus":"STRONGEST","summary":"...","selectedExperienceIds":["..."],"rephrasedAchievements":[{"experienceId":"...","original":"...","rephrased":"..."}],"selectedSkillIds":["..."]}]`,

      `JD:\n${init.jobDescription}\n\nRequired: ${jd.hardSkills.join(", ")}\nSoft: ${jd.softSkills.join(", ")}\nLevel: ${jd.seniority}\n\nCANDIDATE:\n${experienceText}\n${skillsText}`,
      6000,
      { temperature: 0.5 },
    );
  },
});

export const tailorCvWorkflow = createWorkflow({
  id: "tailor-cv",
  inputSchema: z.object({
    jobDescription: z.string(),
    userId: z.string(),
  }),
  outputSchema: strategiesOutputSchema,
})
  .then(analyzeJd)
  .then(fetchRelevant)
  .then(generateStrategies)
  .commit();
