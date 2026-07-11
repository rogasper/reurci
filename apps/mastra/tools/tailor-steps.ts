import { z } from "zod";
import { callAndParse } from "../lib/ai-utils";

const variantSchema = z.object({
  text: z.string(),
  focus: z.string(),
});

const variantsOutput = z.object({
  variants: z.array(variantSchema),
});

const flatSummarySchema = z.object({
  strongest: z.string().optional(),
  relevance: z.string().optional(),
  balanced: z.string().optional(),
}).transform((d) => {
  const variants: { text: string; focus: string }[] = [];
  if (d.strongest) variants.push({ text: d.strongest, focus: "STRONGEST" });
  if (d.relevance) variants.push({ text: d.relevance, focus: "RELEVANCE" });
  if (d.balanced) variants.push({ text: d.balanced, focus: "BALANCED" });
  return { variants };
});

export const summaryOutput = variantsOutput.or(flatSummarySchema as any);

const rephrasedSchema = z.object({ text: z.string(), original: z.string() });
const rephraseOutput = z.object({ variants: z.array(rephrasedSchema) });
const flatRephraseSchema = z.object({
  version1: z.string().optional(),
  version2: z.string().optional(),
  version3: z.string().optional(),
}).transform((d) => {
  const variants: { text: string; original: string }[] = [];
  if (d.version1) variants.push({ text: d.version1, original: d.version1.slice(0, 50) });
  if (d.version2) variants.push({ text: d.version2, original: d.version2.slice(0, 50) });
  if (d.version3) variants.push({ text: d.version3, original: d.version3.slice(0, 50) });
  return { variants };
});

export const paraphraseOutput = rephraseOutput.or(flatRephraseSchema as any);

const skillScoreSchema = z.object({
  skills: z.array(z.object({
    id: z.string(),
    name: z.string(),
    matchScore: z.number().int().min(0).max(100),
    reason: z.string(),
  })),
});

const regenOutput = z.object({ variants: z.array(z.object({ text: z.string() })) });
const flatRegenSchema = z.object({
  v1: z.string().optional(),
  v2: z.string().optional(),
  v3: z.string().optional(),
}).transform((d) => {
  const variants: { text: string }[] = [];
  if (d.v1) variants.push({ text: d.v1 });
  if (d.v2) variants.push({ text: d.v2 });
  if (d.v3) variants.push({ text: d.v3 });
  return { variants };
});

export const regenerateOutput = regenOutput.or(flatRegenSchema as any);

const contextOutput = z.object({
  bulletPoints: z.array(z.string()),
});

const relevanceItem = z.object({ id: z.string(), score: z.number().int().min(0).max(100), reason: z.string() });
const relevanceOutput = z.object({ results: z.array(relevanceItem) });

const coverLetterOutput = z.object({ letter: z.string() });

export async function generateSummaryVariants(
  jd: string,
  profile: { experiences: { role: string; company: string }[]; skills: { name: string }[] },
): Promise<z.infer<typeof summaryOutput>> {
  return callAndParse(
    summaryOutput,
    `You are a CV professional summary writer. Generate 3 different ATS-optimized summaries based on the candidate's profile and job description.
Each variant must have a different focus:
1. STRONGEST — lead with most impressive achievements
2. RELEVANCE — closest match to job requirements  
3. BALANCED — broad coverage
Only rephrase from given data — never invent. Return JSON with exactly 3 variants.`,
    `Job Description:\n${jd}\n\nCandidate: ${profile.experiences.map(e => `${e.role} at ${e.company}`).join(", ")}. Skills: ${profile.skills.map(s => s.name).join(", ")}`,
    4000,
    { temperature: 0.5 },
  );
}

export async function generateExperienceVariants(
  jd: string,
  exp: { company: string; role: string; description: string | null; achievements: string[] },
  customContext?: string,
): Promise<z.infer<typeof paraphraseOutput>> {
  const contextNote = customContext ? `\nADDITIONAL CONTEXT from user: ${customContext}\nPlease incorporate this knowledge while staying truthful to the original data.` : "";
  return callAndParse(
    paraphraseOutput,
    `You rewrite CV experience bullet points for specific job applications.
Generate 3 rephrased versions with different angles:
1. QUANTITATIVE — emphasize numbers and measurable impact
2. SKILLS-FOCUSED — highlight technical skills used
3. CONCISE — shorter, punchier version
CRITICAL: ONLY rephrase from given source — NEVER invent new facts, titles, dates, or skills.${contextNote}
Return JSON with exactly 3 variants, each with "text" (the full rephrased experience description) and "original" (the first line of the original text for reference).`,
    `Job Description:\n${jd.slice(0, 2000)}\n\nExperience to rephrase:\n${exp.role} at ${exp.company}\n${exp.description ?? ""}\nAchievements:\n${exp.achievements.map(a => `- ${a}`).join("\n")}`,
    4000,
    { temperature: 0.5 },
  );
}

export async function scoreSkillsAgainstJd(
  jd: string,
  skills: { id: string; name: string; proficiency: number | null }[],
): Promise<z.infer<typeof skillScoreSchema>> {
  return callAndParse(
    skillScoreSchema,
    `You analyze which skills from a candidate's profile are most relevant to a job description.
For each skill, assign a matchScore (0-100) based on how well it matches the job requirements, and a short reason.
Score 80-100: directly mentioned in JD and critical
Score 50-79: related to JD requirements
Score 1-49: present in profile but not particularly relevant to JD
Return JSON with all skills scored.`,
    `Job Description:\n${jd.slice(0, 2000)}\n\nCandidate Skills:\n${skills.map(s => `- ${s.name} ${s.proficiency ? `(${s.proficiency}/5)` : ""}`).join("\n")}`,
    3000,
    { temperature: 0.2 },
  );
}

export async function regenerateVariants(
  jd: string,
  section: string,
  currentText: string,
  customContext: string,
): Promise<z.infer<typeof regenerateOutput>> {
  return callAndParse(
    regenerateOutput,
    `You are improving a CV ${section} section. The user provided additional context to refine the output.
Incorporate the new context while staying truthful to the original facts. Never invent achievements, dates, or titles.
Return 3 improved variants.`,
    `Job Description:\n${jd.slice(0, 1000)}\n\nCurrent ${section} text:\n${currentText}\n\nAdditional context from user:\n${customContext}`,
    4000,
    { temperature: 0.5, retries: 1 },
  );
}

export async function analyzeRelevance(
  jd: string,
  experiences: { id: string; company: string; role: string; description: string | null; achievements: string[] }[],
): Promise<z.infer<typeof relevanceOutput>> {
  return callAndParse(
    relevanceOutput,
    `You analyze CV experiences against a job description.
For each experience, assign a matchScore (0-100) indicating how relevant it is to the JD, and a short reason.
Score 80+: directly relevant, should include
Score 50-79: partially relevant, include if space permits
Score below 50: low relevance, candidate may skip this experience
Return JSON with all experiences scored.`,
    `Job Description:\n${jd.slice(0, 2000)}\n\nExperiences:\n${experiences.map((e) => `- ${e.role} at ${e.company}\n  ${(e.description ?? "").slice(0, 200)}\n  Achievements: ${e.achievements.slice(0, 2).join(" | ")}`).join("\n")}`,
    3000,
    { temperature: 0.2 },
  );
}

export async function generateFromContext(
  jd: string,
  userContext: string,
): Promise<z.infer<typeof contextOutput>> {
  return callAndParse(
    contextOutput,
    `You are an expert CV writer. The user describes an experience not yet in their CV.
Generate 3-5 professional, ATS-friendly bullet points that:
- Quantify achievements when possible
- Use strong action verbs
- Stay truthful to the user's description
- Highlight skills valuable for the job
Return JSON with bulletPoints array.`,
    `Job Description (for context):\n${jd.slice(0, 1500)}\n\nUser's description:\n${userContext}`,
    3000,
    { temperature: 0.4 },
  );
}

export async function generateCoverLetter(
  jd: string,
  cvSnapshot: { summary?: string; experiences?: { company: string; role: string; achievements?: string[] }[]; skills?: { name: string }[] },
): Promise<z.infer<typeof coverLetterOutput>> {
  const expText = (cvSnapshot.experiences ?? [])
    .slice(0, 3)
    .map((e) => `${e.role} at ${e.company} — ${(e.achievements ?? []).slice(0, 2).join(", ")}`)
    .join("\n");
  const skillText = (cvSnapshot.skills ?? []).slice(0, 10).map((s) => s.name).join(", ");
  return callAndParse(
    coverLetterOutput,
    `You write professional cover letters tailored to job descriptions.
The user's CV has already been tailored to this specific job.
Write a concise, professional cover letter (3-4 paragraphs, ~250 words):
- Opening: expressing interest in the role
- Body: connect candidate's relevant experience to job requirements
- Closing: call to action
Use professional tone. No markdown. Return JSON with "letter" field.`,
    `Job Description:\n${jd.slice(0, 2000)}\n\nSummary: ${(cvSnapshot.summary ?? "").slice(0, 500)}\n\nKey Experiences:\n${expText}\n\nKey Skills: ${skillText}`,
    3000,
    { temperature: 0.4 },
  );
}
