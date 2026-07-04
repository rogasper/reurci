import { z } from "zod";
import { callAndParse } from "../lib/ai-utils";

const experienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).default([]),
});

const expArrSchema = z.object({ experiences: z.array(experienceSchema).default([]) });
const skillsArrSchema = z.object({ skills: z.array(z.object({
  name: z.string(),
  proficiency: z.number().int().min(1).max(5).optional(),
})).default([]) });
const eduArrSchema = z.object({ educations: z.array(z.object({
  institution: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  yearStart: z.number().int().optional(),
  yearEnd: z.number().int().optional(),
})).default([]) });

const EXP_PROMPT = `Extract work experiences from the CV text below.
Return JSON: { experiences: [{ company, role, periodStart, periodEnd?, description?, achievements[] }] }
- Dates: "YYYY-MM" or "YYYY". Omit periodEnd if current/present.
- If none found, return { "experiences": [] }`;

const SKILL_PROMPT = `Extract skills from the CV text below.
Return JSON: { skills: [{ name, proficiency? }] }
- Proficiency 1-5 (expert=5, proficient=4, familiar=2, etc.)
- If none found, return { "skills": [] }`;

const EDU_PROMPT = `Extract education entries from the CV text below.
Return JSON: { educations: [{ institution, degree?, field?, yearStart?, yearEnd? }] }
- Look carefully: education may appear in a dedicated "Education" section OR be briefly mentioned in the summary/work history.
- Even if no clear degree/institution format, extract any mention of schools, universities, majors, or certifications.
- If none found at all, return { "educations": [] }`;

export async function parseCV(rawText: string) {
  const text = rawText.slice(0, 5000);

  const [exp, skills, edu] = await Promise.all([
    callAndParse(expArrSchema, EXP_PROMPT, text, 4000)
      .catch(() => ({ experiences: [] })),
    callAndParse(skillsArrSchema, SKILL_PROMPT, text, 2000)
      .catch(() => ({ skills: [] })),
    callAndParse(eduArrSchema, EDU_PROMPT, text, 2000)
      .catch(() => ({ educations: [] })),
  ]);

  return {
    experiences: exp.experiences ?? [],
    skills: skills.skills ?? [],
    educations: edu.educations ?? [],
  };
}
