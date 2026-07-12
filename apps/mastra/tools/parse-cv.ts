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

const certArrSchema = z.object({ certificates: z.array(z.object({
  name: z.string(),
  issuer: z.string().optional(),
  year: z.number().int().optional(),
})).default([]) });

const langArrSchema = z.object({ languages: z.array(z.object({
  name: z.string(),
  proficiency: z.string().optional(),
})).default([]) });

const achievementArrSchema = z.object({ achievements: z.array(z.object({
  title: z.string(),
  description: z.string().optional(),
  year: z.number().int().optional(),
})).default([]) });

const projectArrSchema = z.object({ projects: z.array(z.object({
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  year: z.number().int().optional(),
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

const CERT_PROMPT = `Extract certifications, licenses, and professional credentials from the CV text below.
Return JSON: { certificates: [{ name, issuer?, year? }] }
- Look for certifications (AWS, PMP, CISSP, etc.), licenses, and professional credentials
- Often found in a dedicated "Certifications" section or mentioned near education/skills
- If none found, return { "certificates": [] }`;

const LANG_PROMPT = `Extract languages from the CV text below.
Return JSON: { languages: [{ name, proficiency? }] }
- Look for languages the candidate speaks: English, Indonesian, Japanese, etc.
- Proficiency levels: Native, Fluent, C2, C1, B2, B1, A2, A1, Intermediate, Basic, etc.
- Often found in a "Languages" section or mentioned in the summary
- If none found, return { "languages": [] }`;

const ACHIEVEMENT_PROMPT = `Extract awards, honors, and notable achievements from the CV text below.
Return JSON: { achievements: [{ title, description?, year? }] }
- Look for awards (Employee of the Year, Dean's List, scholarships, hackathon wins, etc.)
- Honors and recognition
- Often found in "Awards", "Achievements", or "Honors" sections
- If none found, return { "achievements": [] }`;

const PROJECT_PROMPT = `Extract personal projects, open source contributions, freelance work, or side projects from the CV text below.
Return JSON: { projects: [{ name, description?, url?, techStack?: string[], year? }] }
- Look for projects mentioned in a dedicated "Projects" or "Side Projects" section
- May also appear within experience entries described as personal/volunteer work
- techStack: list of technologies used in this project
- If none found, return { "projects": [] }`;

export async function parseCV(rawText: string) {
  const text = rawText.slice(0, 5000);

  const [exp, skills, edu, cert, lang, ach, proj] = await Promise.all([
    callAndParse(expArrSchema, EXP_PROMPT, text, 4000)
      .catch(() => ({ experiences: [] })),
    callAndParse(skillsArrSchema, SKILL_PROMPT, text, 2000)
      .catch(() => ({ skills: [] })),
    callAndParse(eduArrSchema, EDU_PROMPT, text, 2000)
      .catch(() => ({ educations: [] })),
    callAndParse(certArrSchema, CERT_PROMPT, text, 2000)
      .catch(() => ({ certificates: [] })),
    callAndParse(langArrSchema, LANG_PROMPT, text, 2000)
      .catch(() => ({ languages: [] })),
    callAndParse(achievementArrSchema, ACHIEVEMENT_PROMPT, text, 2000)
      .catch(() => ({ achievements: [] })),
    callAndParse(projectArrSchema, PROJECT_PROMPT, text, 2000)
      .catch(() => ({ projects: [] })),
  ]);

  return {
    experiences: exp.experiences ?? [],
    skills: skills.skills ?? [],
    educations: edu.educations ?? [],
    certificates: cert.certificates ?? [],
    languages: lang.languages ?? [],
    achievements: ach.achievements ?? [],
    projects: proj.projects ?? [],
  };
}
