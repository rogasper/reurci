export const STORAGE_KEY = "reurci:tailor-state";

export interface Variant {
  text: string;
  focus?: string;
  original?: string;
}

export interface Pii {
  name: string; email: string; phone: string; address: string; linkedin: string;
}

export interface RelScore {
  id: string; score: number; reason: string;
}

export interface CustomSk {
  name: string;
}

export interface SkillEntry {
  id: string; name: string; selected: boolean; matchScore?: number;
}

export interface ExpEntry {
  id: string; company: string; role: string; periodStart: string; periodEnd: string | null;
  description: string | null; achievements: string[];
  included: boolean;
  variants: Variant[] | null; selVar: number | null; edit: string | null; loading: boolean;
}

export interface TailorState {
  jd: string;
  sumV: Variant[] | null; sumSel: number | null; sumEdit: string | null;
  expState: ExpEntry[]; skillS: SkillEntry[]; customSk: CustomSk[]; relScores: RelScore[] | null;
}
