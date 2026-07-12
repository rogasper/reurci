import { z } from "zod";
import { callAndParse } from "../lib/ai-utils";

const variantSchema = z.object({
  text: z.string(),
  focus: z.string(),
});

const flexibleVariantSchema = z.object({
  text: z.string().optional(),
  summary: z.string().optional(),
  focus: z.string().optional(),
  variant: z.string().optional(),
}).transform((v) => ({
  text: v.text ?? v.summary ?? "",
  focus: v.focus ?? v.variant ?? "",
}));

const variantsOutput = z.object({
  variants: z.array(variantSchema),
});

const flexibleVariantsOutput = z.object({
  variants: z.array(flexibleVariantSchema),
});

const flatSummarySchema = z.object({
  STRONGEST: z.string().optional(),
  strongest: z.string().optional(),
  RELEVANCE: z.string().optional(),
  relevance: z.string().optional(),
  BALANCED: z.string().optional(),
  balanced: z.string().optional(),
  MINIMAL: z.string().optional(),
  minimal: z.string().optional(),
}).passthrough().transform((d) => {
  const variants: { text: string; focus: string }[] = [];
  if (d.STRONGEST || d.strongest) variants.push({ text: (d.STRONGEST || d.strongest)!, focus: "STRONGEST" });
  if (d.RELEVANCE || d.relevance) variants.push({ text: (d.RELEVANCE || d.relevance)!, focus: "RELEVANCE" });
  if (d.BALANCED || d.balanced) variants.push({ text: (d.BALANCED || d.balanced)!, focus: "BALANCED" });
  if (d.MINIMAL || d.minimal) variants.push({ text: (d.MINIMAL || d.minimal)!, focus: "MINIMAL" });
  return { variants };
});

export const summaryOutput = variantsOutput.or(flexibleVariantsOutput as any).or(flatSummarySchema as any);

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

const flatArrayRephraseSchema = z.array(z.object({
  text: z.string(),
  original: z.string().optional(),
})).transform((arr) => ({
  variants: arr.map((v) => ({ text: v.text, original: v.original ?? v.text.slice(0, 50) })),
}));

export const paraphraseOutput = rephraseOutput.or(flatArrayRephraseSchema as any).or(flatRephraseSchema as any);

const skillScoreSchema = z.object({
  skills: z.array(z.object({
    id: z.string(),
    name: z.string(),
    matchScore: z.number().int().min(0).max(100),
    reason: z.string(),
  })),
});

const flexibleSkillsSchema = z.object({
  skills: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    skill: z.string().optional(),
    matchScore: z.number().optional(),
    score: z.number().optional(),
    reason: z.string().optional(),
  })),
}).transform((d) => ({
  skills: d.skills.map((item, i) => ({
    id: item.id ?? String(i),
    name: item.name ?? item.skill ?? "",
    matchScore: item.matchScore ?? item.score ?? 50,
    reason: item.reason ?? "",
  })),
}));

const flatSkillsSchema = z.array(z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  skill: z.string().optional(),
  matchScore: z.number().optional(),
  score: z.number().optional(),
  reason: z.string().optional(),
})).transform((arr) => ({
  skills: arr.map((item, i) => ({
    id: item.id ?? String(i),
    name: item.name ?? item.skill ?? "",
    matchScore: item.matchScore ?? item.score ?? 50,
    reason: item.reason ?? "",
  })),
}));

const flatSkillsObjectSchema = z.record(z.string(), z.object({
  matchScore: z.number().optional(),
  score: z.number().optional(),
  reason: z.string().optional(),
}).passthrough()).transform((d) => ({
  skills: Object.entries(d).map(([name, v], i) => ({
    id: String(i),
    name,
    matchScore: (v as any).matchScore ?? (v as any).score ?? 50,
    reason: (v as any).reason ?? "",
  })),
}));

const skillScoreCombined = skillScoreSchema.or(flexibleSkillsSchema as any).or(flatSkillsSchema as any).or(flatSkillsObjectSchema as any);

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

const flatContextSchema = z.array(z.string()).transform((arr) => ({
  bulletPoints: arr,
}));

const contextCombined = contextOutput.or(flatContextSchema as any);

const relevanceItem = z.object({ id: z.string(), score: z.number().int().min(0).max(100), reason: z.string() });
const relevanceOutput = z.object({ results: z.array(relevanceItem) });

const flatRelevanceSchema = z.array(z.object({
  id: z.string().optional(),
  experience: z.string().optional(),
  score: z.number().optional(),
  matchScore: z.number().optional(),
  reason: z.string(),
})).transform((arr) => ({
  results: arr.map((item, i) => {
    const expId = item.experience?.match(/\[ID:\s*(.+?)\]/)?.[1];
    return {
      id: item.id ?? expId ?? String(i),
      score: item.score ?? item.matchScore ?? 50,
      reason: item.reason,
    };
  }),
}));

const combinedRelevanceOutput = relevanceOutput.or(flatRelevanceSchema as any);

const coverLetterOutput = z.object({ letter: z.string() });

const flatCoverLetterSchema = z.string().transform((str) => ({
  letter: str,
}));

const coverLetterCombined = coverLetterOutput.or(flatCoverLetterSchema as any);

const cvReviewItemSchema = z.object({
  category: z.string(),
  item: z.string(),
  status: z.enum(["pass", "critical", "warning", "unverifiable"]),
  detail: z.string(),
});

const cvReviewOutput = z.object({
  experienceLevel: z.string(),
  items: z.array(cvReviewItemSchema),
  overallAssessment: z.string(),
  quickWins: z.array(z.string()),
});

const flatReviewSchema = z.array(cvReviewItemSchema).transform((arr) => ({
  experienceLevel: "Unknown",
  items: arr,
  overallAssessment: "",
  quickWins: [],
}));

const cvReviewCombined = cvReviewOutput.or(flatReviewSchema as any);

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

Rules:
- Be specific and quantified — cite achievements with numbers, scope, or scale when possible
- Use action-oriented, professional language
- No fluff adjectives: excellent, innovative, proven track record, seasoned, passionate
- Adapt phrasing to match JD keywords and priorities — reorder and emphasize relevant skills naturally
- Core facts (titles, dates, company names) must remain unchanged
Return exactly: { "variants": [{ "text": "<summary>", "focus": "STRONGEST" }, { "text": "<summary>", "focus": "RELEVANCE" }, { "text": "<summary>", "focus": "BALANCED" }] }`,
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

CV BEST PRACTICE RULES for EVERY generated bullet:
- Show accomplishments, not job duties — every bullet must demonstrate impact
- Include quantified results (numbers, %, scale) — metrics near the start of the bullet
- Start with a strong past-tense action verb — NO weak verbs: aided, assisted, helped, participated, worked on, utilized, used, ran, coded, exposed to, gained experience
- Follow STAR, XYZ, or CAR structure (Situation, Task, Action, Result)
- No personal pronouns (I, we, my, our)
- No periods at end of bullets
- Use digits (8) not spelled-out numbers (eight)
- Keep each bullet 1-2 lines — concise and scannable
- No superfluous adjectives: excellent, innovative, creatively, successfully
- No sub-bullets

CRITICAL: Keep core facts unchanged (titles, dates, company names) but feel free to enhance phrasing, incorporate JD keywords naturally, restructure for impact, and reorder achievements to match JD priorities.${contextNote}
IMPORTANT: If the experience has no existing bullet points, generate them from the role, company, and job description — create realistic, specific accomplishments based on what someone in that role at that company would have done.
Return JSON with exactly 3 variants, each with "text" (all rephrased bullet points separated by \\n (newline) — one achievement per line, no dash prefixes) and "original" (the first line of the original text for reference).`,
    `Job Description:\n${jd.slice(0, 2000)}\n\nExperience to rephrase:\n${exp.role} at ${exp.company}\nDescription: ${exp.description ?? "None"}\nAchievements:\n${exp.achievements.length > 0 ? exp.achievements.map(a => `- ${a}`).join("\n") : "(Generate from role + JD context)"}`,
    4000,
    { temperature: 0.5 },
  );
}

export async function scoreSkillsAgainstJd(
  jd: string,
  skills: { id: string; name: string; proficiency: number | null }[],
): Promise<z.infer<typeof skillScoreCombined>> {
  return callAndParse(
    skillScoreCombined,
    `You analyze which skills from a candidate's profile are most relevant to a job description.
For each skill, assign a matchScore (0-100) based on how well it matches the job requirements, and a short reason.
Score 80-100: directly mentioned in JD and critical
Score 50-79: related to JD requirements
Score 1-49: present in profile but not particularly relevant to JD

In your reason text, also flag these CV best-practice issues if present:
- Soft skills (teamwork, leadership, communication) — should be demonstrated in bullets, not listed
- Basic/assumed skills (MS Word, typing, VS Code, IDEs) — should be removed
- Operating systems listed as skills — should be removed
- "GitHub"/"GitLab" — use "Git" instead
- Descriptors like "Expert in", "Proficient in" — skill name only
- Improper capitalization (solidworks → SolidWorks, labview → LabVIEW)
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
Incorporate the new context and JD keywords — enhance phrasing, restructure for impact, and adapt language to match the job requirements. Core facts (titles, dates, company names) remain unchanged.

CV BEST PRACTICE RULES for every generated variant:
- Show accomplishments, not duties — quantify with numbers, %, or scale
- Metrics near the start of each bullet
- Start with a strong past-tense action verb — no weak verbs (aided, assisted, helped, utilized, worked on)
- Follow STAR/XYZ/CAR structure
- No personal pronouns, no periods at end of bullets
- Use digits (8) not spelled-out numbers (eight)
- Keep bullets 1-2 lines, no fluff adjectives

${section === "experience" ? 'CRITICAL FORMATTING: For experience variants, the "text" field must contain all bullet points separated by \\n (newline) — one achievement per line, no dash prefixes. ' : ''}Return 3 improved variants.`,
    `Job Description:\n${jd.slice(0, 1000)}\n\nCurrent ${section} text:\n${currentText}\n\nAdditional context from user:\n${customContext}`,
    4000,
    { temperature: 0.5, retries: 1 },
  );
}

export async function analyzeRelevance(
  jd: string,
  experiences: { id: string; company: string; role: string; description: string | null; achievements: string[] }[],
): Promise<z.infer<typeof combinedRelevanceOutput>> {
  return callAndParse(
    combinedRelevanceOutput,
    `You analyze CV experiences against a job description.
For each experience, assign a matchScore (0-100) indicating how relevant it is to the JD, and a short reason.
Score 80+: directly relevant, should include
Score 50-79: partially relevant, include if space permits
Score below 50: low relevance, candidate may skip this experience
Use the id from the [ID: ...] prefix in each experience entry.
Return: { "results": [{ "id": "...", "score": 80, "reason": "..." }] }`,
    `Job Description:\n${jd.slice(0, 2000)}\n\nExperiences:\n${experiences.map((e) => `- [ID: ${e.id}] ${e.role} at ${e.company}\n  ${(e.description ?? "").slice(0, 200)}\n  Achievements: ${e.achievements.slice(0, 2).join(" | ")}`).join("\n")}`,
    3000,
    { temperature: 0.2 },
  );
}

export async function generateFromContext(
  jd: string,
  userContext: string,
): Promise<z.infer<typeof contextCombined>> {
  return callAndParse(
    contextCombined,
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
): Promise<z.infer<typeof coverLetterCombined>> {
  const expText = (cvSnapshot.experiences ?? [])
    .slice(0, 3)
    .map((e) => `${e.role} at ${e.company} — ${(e.achievements ?? []).slice(0, 2).join(", ")}`)
    .join("\n");
  const skillText = (cvSnapshot.skills ?? []).slice(0, 10).map((s) => s.name).join(", ");
  return callAndParse(
    coverLetterCombined,
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

const categorizeSkillsSchema = z.object({
  skills: z.array(z.object({
    id: z.union([z.string(), z.number()]).transform(String),
    name: z.string(),
    category: z.string(),
  })),
  newCategories: z.array(z.string()).optional(),
});

const CATEGORY_LIST = ["Frontend", "Backend", "Databases", "API & System", "Tools", "AI-Native", "DevOps", "Languages", "Mobile", "Design", "Other"];

export async function categorizeSkills(items: { id: string; name: string }[], knownCategories: Record<string, string> = {}): Promise<z.infer<typeof categorizeSkillsSchema>> {
  const unknown = items.filter(i => !knownCategories[i.name.toLowerCase()]);
  if (unknown.length === 0) {
    return { skills: items.map(i => ({ id: i.id, name: i.name, category: knownCategories[i.name.toLowerCase()] ?? "" })) };
  }
  return callAndParse(
    categorizeSkillsSchema,
    `You are a skill taxonomy expert. Categorize each skill into one of these categories:
${CATEGORY_LIST.join(", ")}

Rules:
- Frontend: React, Vue, Angular, CSS, JS, HTML, Next.js, Tailwind, etc.
- Backend: Node.js, Go, Python, Java, Express, Laravel, REST API, etc.
- Databases: PostgreSQL, MySQL, MongoDB, Redis, SQLite, etc.
- API & System: API design, Microservices, ERD, System architecture, etc.
- Tools: Git, Docker, Postman, CI/CD, Linux, VS Code, etc.
- AI-Native: LLM, Prompt engineering, AI integration, etc.
- DevOps: Kubernetes, Terraform, AWS, GCP, etc.
- Languages: TypeScript, JavaScript, Go, Python, Java, etc.
- Mobile: React Native, Flutter, Swift, Kotlin, etc.
- Design: Figma, UI/UX, Photoshop, etc.
- Other: anything that doesn't fit above

If a skill doesn't fit any existing category, create a new category name that makes sense.
Return JSON: { skills: [{ id, name, category }], newCategories: ["Cat1", "Cat2"] }`,
    `Skills to categorize:\n${unknown.map(i => `${i.id}|${i.name}`).join("\n")}`,
    4000,
    { temperature: 0.1 },
  );
}

const projectRelevanceSchema = z.object({
  projects: z.array(z.object({
    id: z.string(),
    matchScore: z.number().int().min(0).max(100),
    reason: z.string(),
  })),
});

const flexibleProjectSchema = z.object({
  projects: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    matchScore: z.number().optional(),
    score: z.number().optional(),
    reason: z.string().optional(),
  })),
}).transform((d) => ({
  projects: d.projects.map((item, i) => ({
    id: item.id ?? item.name ?? String(i),
    matchScore: item.matchScore ?? item.score ?? 50,
    reason: item.reason ?? "",
  })),
}));

const flatProjectObjectSchema = z.record(z.string(), z.object({
  matchScore: z.number().optional(),
  score: z.number().optional(),
  reason: z.string(),
}).passthrough()).transform((d) => ({
  projects: Object.entries(d).map(([name, v]) => ({
    id: name,
    matchScore: (v as any).matchScore ?? (v as any).score ?? 50,
    reason: (v as any).reason ?? "",
  })),
}));

const flatProjectArraySchema = z.array(z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  matchScore: z.number().optional(),
  score: z.number().optional(),
  reason: z.string().optional(),
})).transform((arr) => ({
  projects: arr.map((item, i) => ({
    id: item.id ?? item.name ?? String(i),
    matchScore: item.matchScore ?? item.score ?? 50,
    reason: item.reason ?? "",
  })),
}));

const projectRelevanceCombined = projectRelevanceSchema
  .or(flexibleProjectSchema as any)
  .or(flatProjectObjectSchema as any)
  .or(flatProjectArraySchema as any)
  .transform((d) => ({
    projects: d.projects.map((p: any) => ({ id: p.id, score: p.matchScore ?? p.score ?? 50, reason: p.reason ?? "" })),
  }));

export async function scoreProjectsAgainstJd(
  jd: string,
  projects: { id: string; name: string; description: string; techStack: string[] }[],
): Promise<z.infer<typeof projectRelevanceCombined>> {
  return callAndParse(
    projectRelevanceCombined,
    `You analyze which projects (personal, open source, freelance) from a candidate's portfolio are most relevant to a job description.
For each project, assign a matchScore (0-100) based on how well it aligns with the job requirements, and a short reason.
Score 80-100: directly relevant tech stack / domain / experience
Score 50-79: partially relevant (some overlap)
Score 0-49: low relevance — consider omitting`,
    `Job Description:\n${jd.slice(0, 2000)}\n\nProjects:\n${projects.map(p => `- ${p.name}: ${p.description.slice(0, 200)} (${p.techStack.join(", ")})`).join("\n")}`,
    4000,
    { temperature: 0.2 },
  );
}

export async function reviewCv(cvText: string): Promise<z.infer<typeof cvReviewCombined>> {
  return callAndParse(
    cvReviewCombined,
    `You are an expert CV reviewer. Review the CV against this checklist and return structured feedback.
First detect experience level: Student/New Grad (<2yr), Mid-level (2-9yr), Senior (10+yr).
For EVERY item below, assign ONE of: "pass", "critical", "warning", or "unverifiable".
CRITICAL severity rules — DO NOT change these assignments:
- Multi-column/table layout → critical
- Paragraphs instead of bullet points → critical
- Bullets describe duties not accomplishments → critical
- No quantified results anywhere → critical
- Bullets don't start with action verbs (consistent) → critical
- No bullets follow STAR/XYZ/CAR structure → critical
- Section order wrong for experience level → critical
- Outdated email provider (AOL/Yahoo/Hotmail) → critical
- Bias-causing personal details (age, gender, nationality, marital status, religion, photo) → critical
- Skills in bullets don't match Skills section → critical
- Paragraphs in Projects section → critical
WARNING severity — do NOT escalate these:
- Non-English section titles → warning
- Summary section present for non-senior → warning
- Wrong date format (02/2016, hyphens, '23 short years) → warning
- Phone with country code or label prefix → warning
- GPA listed when below 3.75 → warning
- Soft skills in Skills section → warning
- Weak verbs (aided, assisted, helped, participated, worked on, utilized, used, ran, coded, exposed to) → warning
- Icons/graphics on resume → warning
- Non-standard font, small font, grey text, justified text → warning
- No periods at end of bullets, personal pronouns, orphaned lines → warning
- High school listed, no-degree schools, coursework, minor awards → warning
- "GitHub" instead of "Git", descriptors like "Expert in", skills not comma-separated → warning
- "project" in project titles, "Personal Project" labels → warning
Formatting/layout checklist:
- Single-column layout (critical)
- No icons/images/graphics (warning)
- Modern readable font, size ≥10.5pt, black color (warning)
- Left-aligned text, sufficient whitespace (warning)
- No excessive bold/italics/ALL CAPS (warning)
- Clear section separation (warning)
- 1 page (or max 2 for 10+yr) (warning)
- Bullets not excessively indented, not past dates (warning)
Dates checklist:
- Right-aligned dates (warning)
- "Present" not "Current"/"Now"/"Ongoing" (warning)
- Full years (2023 not '23), no specific days (warning)
- No digit-only (02/2016), no seasons (warning)
- En dashes with spaces in ranges (warning)
Sections checklist:
- Order: Student=Education→Work→Projects→Skills, Mid=Work→Skills→Education, Senior=Work→Skills→Education (critical)
- English section titles (warning)
- No Summary unless Senior (warning)
- No "References" section (warning)
- Standard names: "Experience" not "Professional Experience" (warning)
Contact checklist:
- No full address/ZIP (warning)
- Phone omitted or no country code/label prefix (warning)
- Modern email provider (Gmail/Outlook) — outdated = critical (warning for multiple emails)
- URLs plain text, no labels (warning)
- GitHub only with READMEs (warning)
- No personal bias details (critical)
Experience checklist:
- Paid work only, research OK (warning)
- Internships/contract labeled (warning)
- Most impressive bullets first (warning)
- Bullets not paragraphs (critical)
- Accomplishments not duties (critical)
- Quantified results required (critical)
- No personal pronouns (warning)
- No periods at bullet end (warning)
- Strong past-tense action verb start (critical)
- No weak verbs listed above (warning)
- No fluff adjectives (excellent, innovative, creatively, successfully) (warning)
- STAR/XYZ/CAR structure (critical)
- Metrics near start of bullet (warning)
- Digits not spelled-out numbers (warning)
- 1-2 line bullets, no sub-bullets (warning)
Education checklist:
- No high school (warning)
- No schools without degree (warning)
- Graduation date only (warning)
- Reverse chronological (warning)
- GPA only if 3.75+ (warning)
- No coursework or minor awards (warning)
Skills checklist:
- No soft skills (warning)
- No basic/assumed skills (Word, typing) (warning)
- No OS listed (warning)
- "Git" not "GitHub" (warning)
- Comma-separated (warning)
- Proper capitalization (warning)
- "C, C++" not "C/C++" (warning)
- No descriptors, skill name only (warning)
- 3 lines max, single column (warning)
- Skills match bullet usage (critical)
Projects checklist (if present):
- No "project" in titles (warning)
- Correct capitalization (warning)
- GitHub preferred over roles/dates (warning)
- No labels beside titles (warning)
- Bullets only, no paragraphs (critical)
- Ordered by relevance (warning)
- GitHub only with READMEs (warning)
Rules:
- Mark formatting/layout items (font, margins, alignment, page length) as "unverifiable" unless clearly evident from text
- Mark every item — never skip items, even passes
- Never mix states on one item — pick ONE of pass/critical/warning/unverifiable
- Be specific: name the exact bullet, section, or item that failed
- Include before/after examples for bullet issues
- Output "quickWins": specific short fixes (verb swap, date format, punctuation)
- Never contradict yourself`,
    `CV to review:\n${cvText}`,
    8000,
    { temperature: 0.2 },
  );
}

const titleSchema = z.object({ title: z.string() });

export async function generateJobTitle(
  jd: string,
  experiences: { role: string; company: string }[],
): Promise<string> {
  const result = await callAndParse(
    titleSchema,
    `You generate a professional job title for a CV header based on the candidate's experience and the job description they are targeting.

Return a short, specific, modern title — not generic like "Software Engineer". Use the most impressive/expert-level framing the experience supports.
Examples: "Senior Full Stack Engineer", "Lead Platform Architect", "Staff Machine Learning Engineer".

Return JSON with a single "title" field.`,
    `Job Description:\n${jd.slice(0, 2000)}\n\nCandidate Experience:\n${experiences.map(e => `${e.role} at ${e.company}`).join("\n")}`,
    1000,
    { temperature: 0.3 },
  );
  return result.title;
}
