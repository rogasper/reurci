import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { ls, ss, apiPost } from "@/utils/storage";
import { computeATSScore } from "@/components/ats-score";
import { decryptPii } from "@/components/pii-section";
import type { Variant, Pii, ExpEntry, SkillEntry, CustomSk, RelScore, TailorState } from "@/types/tailor";
import { STORAGE_KEY } from "@/types/tailor";

export function useTailor(userId: string, initialSnapshot?: {
  jd: string;
  summary: string;
  experiences: { company: string; role: string; periodStart: string; periodEnd: string | null; achievements: string[] }[];
  skills: { name: string }[];
}) {
  const trpc = useTRPC();
  const { data: profile } = useQuery(trpc.profile.getOrCreate.queryOptions());
  const { data: experiences } = useQuery(trpc.experience.list.queryOptions());
  const { data: skills } = useQuery(trpc.skill.list.queryOptions());
  const { data: educations } = useQuery(trpc.education.list.queryOptions());
  const saveVersion = useMutation(trpc.cvVersion.create.mutationOptions());

  const [jd, setJd] = useState(initialSnapshot?.jd ?? "");
  const [pii, setPii] = useState<Pii>({ name: "", email: "", phone: "", address: "", linkedin: "" });
  const [sumV, setSumV] = useState<Variant[] | null>(null);
  const [sumSel, setSumSel] = useState<number | null>(initialSnapshot ? 0 : null);
  const [sumEdit, setSumEdit] = useState<string | null>(initialSnapshot?.summary ?? null);
  const [sumLoad, setSumLoad] = useState(false);
  const [expState, setExpState] = useState<ExpEntry[]>(initialSnapshot ? 
    initialSnapshot.experiences.map((e, i) => ({
      id: `snapshot-${i}`,
      company: e.company,
      role: e.role,
      periodStart: e.periodStart,
      periodEnd: e.periodEnd,
      description: null,
      achievements: e.achievements,
      included: true,
      variants: [{ text: e.achievements.join("\n"), focus: "Saved", original: "" }],
      selVar: 0,
      edit: null,
      loading: false,
    })) : []
  );
  const [skillS, setSkillS] = useState<SkillEntry[]>(initialSnapshot ? 
    initialSnapshot.skills.map((s, i) => ({ id: `snapshot-skill-${i}`, name: s.name, selected: true })) : []
  );
  const [customSk, setCustomSk] = useState<CustomSk[]>([]);
  const [skLoad, setSkLoad] = useState(false);
  const [newSk, setNewSk] = useState("");
  const [ctxLoad, setCtxLoad] = useState(false);
  const [ctxBullets, setCtxBullets] = useState<string[] | null>(null);
  const [ctxSel, setCtxSel] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [relScores, setRelScores] = useState<RelScore[] | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [clLoad, setClLoad] = useState(false);

  // Restore from sessionStorage (skip for snapshot re-edit)
  useEffect(() => {
    if (initialSnapshot) return;
    const s = ls<TailorState>();
    if (s) { setJd(s.jd); setSumV(s.sumV); setSumSel(s.sumSel); setSumEdit(s.sumEdit); if (s.expState) setExpState(s.expState); if (s.skillS) setSkillS(s.skillS); if (s.customSk) setCustomSk(s.customSk); if (s.relScores) setRelScores(s.relScores); }
  }, [initialSnapshot]);

  // Save to sessionStorage (skip for snapshot re-edit)
  useEffect(() => {
    if (initialSnapshot) return;
    if (!jd) return;
    ss(STORAGE_KEY, { jd, sumV, sumSel, sumEdit, expState, skillS, customSk, relScores } satisfies TailorState);
  }, [jd, sumV, sumSel, sumEdit, expState, skillS, customSk, relScores]);

  // Init data from DB + PII
  useEffect(() => { if (!experiences || expState.length > 0) return; setExpState(experiences.map((e: any): ExpEntry => ({ id: e.id, company: e.company, role: e.role, periodStart: e.periodStart, periodEnd: e.periodEnd, description: e.description, achievements: e.achievements ?? [], included: true, variants: null, selVar: null, edit: null, loading: false }))); }, [experiences, expState.length]);
  useEffect(() => { if (!skills || skillS.length > 0) return; setSkillS(skills.map((s: any): SkillEntry => ({ id: s.id, name: s.name, selected: true }))); }, [skills, skillS.length]);
  useEffect(() => { const st = localStorage.getItem("reurci.pii.v1"); if (st && userId) decryptPii(st, userId).then((d) => { if (d) setPii({ name: d.name, email: d.email, phone: d.phone, address: d.address, linkedin: d.linkedin }); }); }, [userId]);

  const sumText = sumEdit ?? (sumV?.[sumSel ?? -1]?.text ?? "");

  const selExps = useMemo(() => expState.filter(e => e.included).map(e => {
    const txt = e.edit ?? (e.variants?.[e.selVar ?? -1]?.text ?? "");
    return { company: e.company, role: e.role, periodStart: e.periodStart, periodEnd: e.periodEnd, achievements: txt.split("\n").filter(Boolean) };
  }), [expState]);

  const selSkills = useMemo(() => [...skillS.filter(s => s.selected).map(s => ({ name: s.name })), ...customSk], [skillS, customSk]);

  const [ats, setAts] = useState(0);
  useEffect(() => {
    if (!jd) { setAts(0); return; }
    const timer = setTimeout(() => {
      const score = computeATSScore({
        jdHardSkills: jd.toLowerCase().match(/\b(?:react|node|python|java|ts|sql|aws|docker|k8s|kubernetes|angular|vue|next|go)\b/g) ?? [],
        selectedExperiences: selExps.map(e => ({ description: "", achievements: e.achievements })),
        selectedSkills: selSkills,
      });
      setAts(score);
    }, 500);
    return () => clearTimeout(timer);
  }, [jd, selExps, selSkills]);

  const generateSummary = useCallback(async () => {
    setSumLoad(true);
    try { const d = await apiPost<{ variants: Variant[] }>("/api/ai/tailor/summary", { jd, profile: { experiences: expState.map(e => ({ role: e.role, company: e.company })), skills: skillS.map(s => ({ name: s.name })) } }); setSumV(d.variants); setSumSel(0); }
    catch { toast.error("Summary failed"); }
    setSumLoad(false);
  }, [jd, expState, skillS]);

  const getRelevance = useCallback(async () => {
    try { const d = await apiPost<{ results: RelScore[] }>("/api/ai/tailor/relevance", { jd, experiences: expState.map(e => ({ id: e.id, company: e.company, role: e.role, description: e.description, achievements: e.achievements })) }); setRelScores(d.results); }
    catch { toast.error("Relevance failed"); }
  }, [jd, expState]);

  const generateExp = useCallback(async (id: string) => {
    setExpState(p => p.map(x => x.id === id ? { ...x, loading: true } : x));
    try {
      const e = expState.find(x => x.id === id); if (!e) return;
      const d = await apiPost<{ variants: Variant[] }>("/api/ai/tailor/experience", { jd, experience: { ...e, achievements: e.achievements ?? [] } });
      setExpState(p => p.map(x => x.id === id ? { ...x, variants: d.variants as any, selVar: 0, loading: false } : x));
    } catch { setExpState(p => p.map(x => x.id === id ? { ...x, loading: false } : x)); }
  }, [jd, expState]);

  const regenerateExp = useCallback(async (id: string, ctx: string) => {
    const e = expState.find(x => x.id === id); if (!e) return;
    setExpState(p => p.map(x => x.id === id ? { ...x, loading: true } : x));
    try {
      const cur = e.edit ?? (e.variants?.[e.selVar ?? -1]?.text ?? e.description ?? "");
      const d = await apiPost<{ variants: Variant[] }>("/api/ai/tailor/regenerate", { jd, section: "experience", current: cur, customContext: ctx });
      setExpState(p => p.map(x => x.id === id ? { ...x, variants: d.variants as any, selVar: 0, edit: null, loading: false } : x));
    } catch { setExpState(p => p.map(x => x.id === id ? { ...x, loading: false } : x)); }
  }, [jd, expState]);

  const regenerateSum = useCallback(async (ctx: string) => {
    setSumLoad(true);
    try { const d = await apiPost<{ variants: Variant[] }>("/api/ai/tailor/regenerate", { jd, section: "summary", current: sumText, customContext: ctx }); setSumV(d.variants); setSumSel(0); }
    catch { toast.error("Regen failed"); }
    setSumLoad(false);
  }, [jd, sumText]);

  const generateSkills = useCallback(async () => {
    setSkLoad(true);
    try { const d = await apiPost<{ skills: any[] }>("/api/ai/tailor/skills", { jd, skills: skillS.map(s => ({ id: s.id, name: s.name, proficiency: null })) }); setSkillS(d.skills.map(s => ({ id: s.id, name: s.name, selected: s.matchScore > 40, matchScore: s.matchScore }))); }
    catch { toast.error("Skills failed"); }
    setSkLoad(false);
  }, [jd, skillS]);

  const generateCtx = useCallback(async (text: string) => {
    setCtxLoad(true); setCtxBullets(null); setCtxSel([]);
    try { const d = await apiPost<{ bulletPoints: string[] }>("/api/ai/tailor/generate-from-context", { jd, userContext: text }); setCtxBullets(d.bulletPoints); }
    catch { toast.error("Failed"); }
    setCtxLoad(false);
  }, [jd]);

  const generateCoverLetter = useCallback(async () => {
    setClLoad(true);
    try {
      const d = await apiPost<{ letter: string }>("/api/ai/tailor/cover-letter", {
        jd, cvSnapshot: { summary: sumText, experiences: selExps, skills: selSkills },
      });
      setCoverLetter(d.letter);
    } catch { toast.error("Cover letter failed"); }
    setClLoad(false);
  }, [jd, sumText, selExps, selSkills]);

  const addCtxBullets = useCallback(() => {
    if (ctxSel.length === 0) return;
    const bullets = ctxBullets?.filter(b => ctxSel.includes(b)) ?? [];
    setExpState(p => [...p, { id: `custom-${Date.now()}`, company: "", role: "Additional Experience", periodStart: "", periodEnd: null, description: "", achievements: bullets, included: true, variants: null, selVar: null, edit: bullets.join("\n"), loading: false }]);
    setCtxBullets(null); setCtxSel([]); toast.success(`Added ${bullets.length} bullet(s)`);
  }, [ctxSel, ctxBullets]);

  const loaded = !!experiences && !!skills;
  const educationsData = (educations ?? []).map((e: any) => ({ institution: e.institution, degree: e.degree, field: e.field, yearStart: e.yearStart, yearEnd: e.yearEnd }));

  return {
    loaded, jd, setJd, pii,
    sumV, sumSel, sumLoad, sumText, sumEdit,
    expState, skillS, customSk, skLoad, newSk, setNewSk,
    ctxLoad, ctxBullets, ctxSel,
    relScores, saving, coverLetter, clLoad,
    selExps, selSkills, ats, educationsData,
    setSumSel, setSumEdit,
    generateSummary, regenerateSum, generateCoverLetter,
    getRelevance, generateExp, regenerateExp,
    generateSkills,
    generateCtx, addCtxBullets, setCtxSel,
    setExpState, setSkillS, setCustomSk,
    saveVersion, setSaving, setRelScores,
  };
}
