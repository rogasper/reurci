import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { apiPost } from "@/utils/storage";
import { computeATSScore } from "@/components/ats-score";
import { decryptPii } from "@/components/pii-section";
import type { Variant, Pii, ExpEntry, SkillEntry, CustomSk, RelScore } from "@/types/tailor";

export function useTailor(userId: string, initialSnapshot?: {
  jd: string;
  summary: string;
  experiences: { company: string; role: string; periodStart: string; periodEnd: string | null; achievements: string[] }[];
  skills: { name: string }[];
  _variants?: any;
}, cvId?: string) {
  const trpc = useTRPC();
  const { data: profile } = useQuery(trpc.profile.getOrCreate.queryOptions());
  const { data: experiences } = useQuery(trpc.experience.list.queryOptions());
  const { data: skills } = useQuery(trpc.skill.list.queryOptions());
  const { data: educations } = useQuery(trpc.education.list.queryOptions());
  const { data: certificates } = useQuery(trpc.certificate.list.queryOptions());
  const { data: languages } = useQuery(trpc.language.list.queryOptions());
  const { data: achievements } = useQuery(trpc.achievement.list.queryOptions());
  const { data: projects } = useQuery(trpc.project.list.queryOptions());
  const saveVersion = useMutation(trpc.cvVersion.create.mutationOptions());
  const updateVersion = useMutation(trpc.cvVersion.update.mutationOptions());

  const savedVariants = (initialSnapshot as any)?._variants;
  const [jd, setJd] = useState(initialSnapshot?.jd ?? "");
  const [pii, setPii] = useState<Pii>({ name: "", title: "", email: "", phone: "", address: "", linkedin: "", github: "", website: "" });
  const [sumV, setSumV] = useState<Variant[] | null>(savedVariants?.sumV ?? null);
  const [sumSel, setSumSel] = useState<number | null>(savedVariants ? (savedVariants.sumSel ?? 0) : (initialSnapshot ? 0 : null));
  const [sumEdit, setSumEdit] = useState<string | null>(savedVariants?.sumV ? null : (initialSnapshot?.summary ?? null));
  const [sumLoad, setSumLoad] = useState(false);
  const [expState, setExpState] = useState<ExpEntry[]>(savedVariants?.expState
    ? savedVariants.expState.map((e: any): ExpEntry => ({ ...e, loading: false }))
    : initialSnapshot
      ? initialSnapshot.experiences.map((e, i) => ({
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
        }))
      : []
  );
  const [skillS, setSkillS] = useState<SkillEntry[]>(savedVariants?.skillS
    ? savedVariants.skillS.map((s: any) => ({ id: s.id, name: s.name, selected: s.selected, matchScore: s.matchScore, category: s.category }))
    : initialSnapshot
      ? initialSnapshot.skills.map((s, i) => ({ id: `snapshot-skill-${i}`, name: s.name, selected: true, category: undefined }))
      : []
  );
  const [customSk, setCustomSk] = useState<CustomSk[]>(savedVariants?.customSk ?? []);
  const [skLoad, setSkLoad] = useState(false);
  const [relLoad, setRelLoad] = useState(false);
  const [newSk, setNewSk] = useState("");
  const [ctxLoad, setCtxLoad] = useState(false);
  const [ctxBullets, setCtxBullets] = useState<string[] | null>(savedVariants?.ctxBullets ?? null);
  const [ctxSel, setCtxSel] = useState<string[]>(savedVariants?.ctxSel ?? []);
  const [saving, setSaving] = useState(false);
  const [relScores, setRelScores] = useState<RelScore[] | null>(savedVariants?.relScores ?? null);
  const [projRelScores, setProjRelScores] = useState<RelScore[] | null>(savedVariants?.projRelScores ?? null);
  const [projRelLoad, setProjRelLoad] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(savedVariants?.coverLetter ?? null);
  const [clLoad, setClLoad] = useState(false);
  const [sectionIncluded, setSectionIncluded] = useState<Record<string, boolean>>(savedVariants?.sectionIncluded ?? {
    education: true, certifications: true, languages: true, achievements: true, projects: true,
  });
  const [sectionOrder, setSectionOrder] = useState<string[]>(savedVariants?.sectionOrder ?? [
    "summary", "experiences", "skills", "education", "certifications", "languages", "achievements", "projects",
  ]);

  useEffect(() => { const st = localStorage.getItem("reurci.pii.v1"); if (st && userId) decryptPii(st, userId).then((d) => { if (d) setPii({ name: d.name, title: d.title ?? "", email: d.email, phone: d.phone, address: d.address, linkedin: d.linkedin, github: d.github ?? "", website: d.website ?? "" }); }); }, [userId]);

  useEffect(() => { if (!experiences || expState.length > 0) return; setExpState(experiences.map((e: any): ExpEntry => ({ id: e.id, company: e.company, role: e.role, periodStart: e.periodStart, periodEnd: e.periodEnd, description: e.description, achievements: e.achievements ?? [], included: true, variants: null, selVar: null, edit: null, loading: false }))); }, [experiences, expState.length]);
  useEffect(() => { if (!skills || skillS.length > 0) return; setSkillS(skills.map((s: any): SkillEntry => ({ id: s.id, name: s.name, category: s.category, selected: true }))); }, [skills, skillS.length]);

  const sumText = sumEdit ?? (sumV?.[sumSel ?? -1]?.text ?? "");

  const selExps = useMemo(() => expState.filter(e => e.included).map(e => {
    const txt = e.edit ?? (e.variants?.[e.selVar ?? -1]?.text ?? "");
    return { company: e.company, role: e.role, periodStart: e.periodStart, periodEnd: e.periodEnd, achievements: txt.split("\n").filter(Boolean) };
  }), [expState]);

  const selSkills = useMemo(() => [...skillS.filter(s => s.selected).map(s => ({ name: s.name, category: s.category })), ...customSk.map(c => ({ name: c.name }))], [skillS, customSk]);

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

  const noJd = () => !jd.trim();

  const generateSummary = useCallback(async () => {
    if (noJd()) return;
    setSumLoad(true);
    try { const d = await apiPost<{ variants: Variant[] }>("/api/ai/tailor/summary", { jd, profile: { experiences: expState.map(e => ({ role: e.role, company: e.company })), skills: skillS.map(s => ({ name: s.name })) } }); setSumV(d.variants); setSumSel(0); }
    catch { toast.error("Summary failed"); }
    setSumLoad(false);
  }, [jd, expState, skillS]);

  const getRelevance = useCallback(async () => {
    if (noJd()) return;
    setRelLoad(true);
    try {
      const d = await apiPost<{ results: RelScore[] }>("/api/ai/tailor/relevance", { jd, experiences: expState.map(e => ({ id: e.id, company: e.company, role: e.role, description: e.description, achievements: e.achievements })) });
      setRelScores(d.results);
      const lowIds = new Set(d.results.filter(r => r.score < 50).map(r => r.id));
      if (lowIds.size > 0) setExpState(prev => prev.map(e => lowIds.has(e.id) ? { ...e, included: false } : e));
    }
    catch { toast.error("Relevance failed"); }
    setRelLoad(false);
  }, [jd, expState]);

  const generateExp = useCallback(async (id: string) => {
    if (noJd()) return;
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
    if (noJd()) return;
    setSumLoad(true);
    try { const d = await apiPost<{ variants: Variant[] }>("/api/ai/tailor/regenerate", { jd, section: "summary", current: sumText, customContext: ctx }); setSumV(d.variants); setSumSel(0); }
    catch { toast.error("Regen failed"); }
    setSumLoad(false);
  }, [jd, sumText]);

  const generateSkills = useCallback(async () => {
    if (noJd()) return;
    setSkLoad(true);
    try { const d = await apiPost<{ skills: any[] }>("/api/ai/tailor/skills", { jd, skills: skillS.map(s => ({ id: s.id, name: s.name, proficiency: null })) }); setSkillS(prev => d.skills.map(s => { const p = prev.find(x => x.id === s.id); return { id: s.id, name: s.name, selected: s.matchScore > 40, matchScore: s.matchScore, category: p?.category }; })); }
    catch { toast.error("Skills failed"); }
    setSkLoad(false);
  }, [jd, skillS]);

  const generateCtx = useCallback(async (text: string) => {
    if (noJd()) return;
    setCtxLoad(true); setCtxBullets(null); setCtxSel([]);
    try { const d = await apiPost<{ bulletPoints: string[] }>("/api/ai/tailor/generate-from-context", { jd, userContext: text }); setCtxBullets(d.bulletPoints); }
    catch { toast.error("Failed"); }
    setCtxLoad(false);
  }, [jd]);

  const generateCoverLetter = useCallback(async () => {
    if (noJd()) return;
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

  const loaded = !!experiences && !!skills && !!certificates && !!languages && !!achievements && !!projects;
  const educationsData = useMemo(() => (educations ?? []).map((e: any) => ({ institution: e.institution, degree: e.degree, field: e.field, yearStart: e.yearStart, yearEnd: e.yearEnd })), [educations]);
  const certificatesData = useMemo(() => (certificates ?? []).map((c: any) => ({ name: c.name, issuer: c.issuer, year: c.year, url: c.url })), [certificates]);
  const languagesData = useMemo(() => (languages ?? []).map((l: any) => ({ name: l.name, proficiency: l.proficiency })), [languages]);
  const achievementsData = useMemo(() => (achievements ?? []).map((a: any) => ({ title: a.title, description: a.description, year: a.year })), [achievements]);
  const projectsData = useMemo(() => (projects ?? []).map((p: any) => ({ name: p.name, description: p.description, url: p.url, techStack: p.techStack ?? [], year: p.year })), [projects]);

  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!cvId || initialSnapshot || !jd.trim()) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      const _variants = {
        sumV, sumSel,
        expState: expState.map(({ loading, ...rest }) => rest),
        skillS, customSk,
        relScores, projRelScores,
        coverLetter,
        ctxBullets, ctxSel,
        sectionIncluded, sectionOrder,
      };
      updateVersion.mutateAsync({
        id: cvId,
        jobTitle: jd.slice(0, 100) || "Untitled",
        jobDescription: jd,
        cvSnapshot: { summary: sumText, experiences: selExps, skills: selSkills, educations: sectionIncluded.education ? educationsData : [], certificates: sectionIncluded.certifications ? certificatesData : [], languages: sectionIncluded.languages ? languagesData : [], achievements: sectionIncluded.achievements ? achievementsData : [], projects: sectionIncluded.projects ? projectsData : [], sectionOrder, _variants },
        atsScore: ats,
      }).catch(() => {});
    }, 30000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [jd, sumText, selExps, selSkills, sectionIncluded, sectionOrder, ats, sumV, sumSel, expState, skillS, relScores, projRelScores, coverLetter, ctxBullets, ctxSel, customSk]);

  const generateProjectRelevance = useCallback(async () => {
    if (noJd()) return;
    setProjRelLoad(true);
    try {
      const d = await apiPost<{ projects: RelScore[] }>("/api/ai/tailor/project-relevance", { jd, projects: projectsData.map(p => ({ id: p.name, name: p.name, description: p.description ?? "", techStack: p.techStack ?? [] })) });
      setProjRelScores(d.projects);
    } catch { toast.error("Project relevance failed"); }
    setProjRelLoad(false);
  }, [jd, projectsData]);

  return {
    loaded, jd, setJd, pii, setPii,
    sumV, sumSel, sumLoad, sumText, sumEdit,
    expState, skillS, customSk, skLoad, relLoad, newSk, setNewSk,
    ctxLoad, ctxBullets, ctxSel,
    relScores, projRelScores, projRelLoad, saving, coverLetter, clLoad,
    selExps, selSkills, ats,
    educationsData, certificatesData, languagesData, achievementsData, projectsData,
    setSumSel, setSumEdit,
    generateSummary, regenerateSum, generateCoverLetter,
    getRelevance, generateExp, regenerateExp,
    generateSkills, generateProjectRelevance,
    generateCtx, addCtxBullets, setCtxSel,
    setExpState, setSkillS, setCustomSk,
    saveVersion, updateVersion, setSaving, setRelScores, sectionIncluded, setSectionIncluded, sectionOrder, setSectionOrder,
  };
}
