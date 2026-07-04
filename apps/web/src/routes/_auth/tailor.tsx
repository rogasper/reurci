import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { env } from "@reurci/env/web";
import { toast } from "sonner";
import { VariantCard } from "@/components/tailor/variant-card";
import { AccordionSection } from "@/components/tailor/accordion-section";
import { RelevanceBadge } from "@/components/tailor/relevance-badge";
import { ContextInput } from "@/components/tailor/context-input";
import { CvPreview } from "@/components/cv-pdf-template";
import { CvDocument } from "@/components/cv-pdf-template";
import { ATSScore, computeATSScore } from "@/components/ats-score";
import { decryptPii } from "@/components/pii-section";
import { pdf } from "@react-pdf/renderer";

export const Route = createFileRoute("/_auth/tailor")({ component: TailorPage });

const Ink = "#08304c", Muted = "#797979";
const KEY = "reurci:tailor-state";
type Pii = { name: string; email: string; phone: string; address: string; linkedin: string };

function ls() { try { const s = sessionStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; } }
function ss(s: any) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
async function post(path: string, body: any) { const r = await fetch(`${env.VITE_SERVER_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) { const t = await r.text(); throw new Error(t.slice(0, 200)); } return r.json(); }

function TailorPage() {
  const { session } = Route.useRouteContext();
  const uid = session.data?.user.id ?? "";
  const trpc = useTRPC();
  const { data: profile } = useQuery(trpc.profile.getOrCreate.queryOptions());
  const { data: experiences } = useQuery(trpc.experience.list.queryOptions());
  const { data: skills } = useQuery(trpc.skill.list.queryOptions());
  const { data: educations } = useQuery(trpc.education.list.queryOptions());
  const saveVersion = useMutation(trpc.cvVersion.create.mutationOptions());

  const [jd, setJd] = useState("");
  const [pii, setPii] = useState<Pii>({ name: "", email: "", phone: "", address: "", linkedin: "" });

  // Summary
  const [sumV, setSumV] = useState<{ text: string; focus: string }[] | null>(null);
  const [sumSel, setSumSel] = useState<number | null>(null);
  const [sumEdit, setSumEdit] = useState<string | null>(null);
  const [sumLoad, setSumLoad] = useState(false);

  // Experiences
  const [expState, setExpState] = useState<any[]>([]);
  // Skills
  const [skillS, setSkillS] = useState<any[]>([]);
  const [customSk, setCustomSk] = useState<{ name: string }[]>([]);
  const [skLoad, setSkLoad] = useState(false);
  const [newSk, setNewSk] = useState("");

  // Context experience
  const [ctxLoad, setCtxLoad] = useState(false);
  const [ctxBullets, setCtxBullets] = useState<string[] | null>(null);
  const [ctxSel, setCtxSel] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [relScores, setRelScores] = useState<{ id: string; score: number; reason: string }[] | null>(null);

  // Restore
  useEffect(() => {
    const s = ls();
    if (s) { setJd(s.jd ?? ""); setSumV(s.sumV); setSumSel(s.sumSel); setSumEdit(s.sumEdit); if (s.expState) setExpState(s.expState); if (s.skillS) setSkillS(s.skillS); if (s.customSk) setCustomSk(s.customSk); if (s.relScores) setRelScores(s.relScores); }
  }, []);
  useEffect(() => { ss({ jd, sumV, sumSel, sumEdit, expState, skillS, customSk, relScores }); }, [jd, sumV, sumSel, sumEdit, expState, skillS, customSk, relScores]);

  // Init
  useEffect(() => { if (!experiences || expState.length > 0) return; setExpState(experiences.map((e: any) => ({ id: e.id, company: e.company, role: e.role, periodStart: e.periodStart, periodEnd: e.periodEnd, description: e.description, achievements: e.achievements ?? [], included: true, variants: null, selVar: null, edit: null, loading: false }))); }, [experiences, expState.length]);
  useEffect(() => { if (!skills || skillS.length > 0) return; setSkillS(skills.map((s: any) => ({ id: s.id, name: s.name, selected: true }))); }, [skills, skillS.length]);
  useEffect(() => { const st = localStorage.getItem("reurci.pii.v1"); if (st && uid) decryptPii(st, uid).then((d) => { if (d) setPii(d); }); }, [uid]);

  const sumText = sumEdit ?? (sumV?.[sumSel ?? -1]?.text ?? "");

  const selExps = useMemo(() => expState.filter((e) => e.included).map((e) => {
    const txt = e.edit ?? (e.variants?.[e.selVar ?? -1]?.text ?? "");
    return { company: e.company, role: e.role, periodStart: e.periodStart, periodEnd: e.periodEnd, achievements: txt.split("\n").filter(Boolean) };
  }), [expState]);

  const selSkills = useMemo(() => [...skillS.filter((s) => s.selected).map((s) => ({ name: s.name })), ...customSk], [skillS, customSk]);

  const ats = useMemo(() => {
    if (!jd) return 0;
    return computeATSScore({
      jdHardSkills: jd.toLowerCase().match(/\b(?:react|node|python|java|ts|sql|aws|docker|k8s|kubernetes|angular|vue|next|go)\b/g) ?? [],
      selectedExperiences: selExps.map((e) => ({ description: "", achievements: e.achievements })),
      selectedSkills: selSkills,
    });
  }, [jd, selExps, selSkills]);

  const genSummary = async () => { setSumLoad(true); try { const d = await post("/api/ai/tailor/summary", { jd, profile: { experiences: expState.map((e: any) => ({ role: e.role, company: e.company })), skills: skillS.map((s: any) => ({ name: s.name })) } }); setSumV(d.variants); setSumSel(0); } catch (e: any) { toast.error("Failed: " + e.message?.slice(0, 60)); } setSumLoad(false); };

  const genRel = async () => { try { const d = await post("/api/ai/tailor/relevance", { jd, experiences: expState.map((e: any) => ({ id: e.id, company: e.company, role: e.role, description: e.description, achievements: e.achievements })) }); setRelScores(d.results); } catch { toast.error("Relevance analysis failed"); } };

  const genExp = async (id: string) => {
    const e = expState.find((x) => x.id === id); if (!e) return;
    setExpState((p) => p.map((x) => x.id === id ? { ...x, loading: true } : x));
    try { const d = await post("/api/ai/tailor/experience", { jd, experience: { ...e, achievements: e.achievements ?? [] } }); setExpState((p) => p.map((x) => x.id === id ? { ...x, variants: d.variants, selVar: 0, loading: false } : x)); }
    catch { setExpState((p) => p.map((x) => x.id === id ? { ...x, loading: false } : x)); }
  };

  const regenExp = async (id: string, ctx: string) => {
    const e = expState.find((x) => x.id === id); if (!e) return;
    setExpState((p) => p.map((x) => x.id === id ? { ...x, loading: true } : x));
    try { const cur = e.edit ?? (e.selVar !== null && e.variants ? e.variants[e.selVar].text : e.description ?? ""); const d = await post("/api/ai/tailor/regenerate", { jd, section: "experience", current: cur, customContext: ctx }); setExpState((p) => p.map((x) => x.id === id ? { ...x, variants: d.variants, selVar: 0, edit: null, loading: false } : x)); }
    catch { setExpState((p) => p.map((x) => x.id === id ? { ...x, loading: false } : x)); }
  };

  const regenSum = async (ctx: string) => {
    setSumLoad(true);
    try { const d = await post("/api/ai/tailor/regenerate", { jd, section: "summary", current: sumText, customContext: ctx }); setSumV(d.variants); setSumSel(0); } catch (e: any) { toast.error("Regen failed"); }
    setSumLoad(false);
  };

  const genSkills = async () => { setSkLoad(true); try { const d = await post("/api/ai/tailor/skills", { jd, skills: skillS.map((s: any) => ({ id: s.id, name: s.name, proficiency: null })) }); setSkillS(d.skills.map((s: any) => ({ id: s.id, name: s.name, selected: s.matchScore > 40, matchScore: s.matchScore }))); } catch { toast.error("Skill scoring failed"); } setSkLoad(false); };

  const genCtx = async (text: string) => { setCtxLoad(true); setCtxBullets(null); setCtxSel([]); try { const d = await post("/api/ai/tailor/generate-from-context", { jd, userContext: text }); setCtxBullets(d.bulletPoints); } catch { toast.error("Failed"); } setCtxLoad(false); };

  const addCtxBullets = () => {
    if (ctxSel.length === 0) return;
    const bullets = ctxBullets?.filter((_, i) => ctxSel.includes(_)) ?? [];
    setExpState((p) => [...p, { id: `custom-${Date.now()}`, company: "", role: "Additional Experience", periodStart: "", periodEnd: null, description: "", achievements: bullets, included: true, variants: null, selVar: null, edit: bullets.join("\n"), loading: false }]);
    setCtxBullets(null); setCtxSel([]); toast.success(`Added ${bullets.length} bullet point(s)`);
  };

  const save = async () => {
    setSaving(true);
    try { await saveVersion.mutateAsync({ jobTitle: jd.slice(0, 100) || "Untitled", jobDescription: jd, cvSnapshot: { summary: sumText, experiences: selExps, skills: selSkills, educations: educations ?? [] }, atsScore: ats }); toast.success("Saved!"); } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  const dl = async () => {
    try { const b = await pdf(<CvDocument data={{ name: pii.name, email: pii.email, phone: pii.phone, linkedin: pii.linkedin, summary: sumText, experiences: selExps, skills: selSkills, educations: (educations ?? []).map((e: any) => ({ institution: e.institution, degree: e.degree, field: e.field, yearStart: e.yearStart, yearEnd: e.yearEnd })) }} />).toBlob(); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "cv.pdf"; a.click(); URL.revokeObjectURL(u); } catch { toast.error("Download failed"); }
  };

  const loaded = !!experiences && !!skills;
  if (!loaded) return <div className="mx-auto max-w-[1400px] px-4 py-10" style={{ paddingTop: "100px" }}><Skeleton className="h-8 w-48 rounded-[16px]" /><Skeleton className="h-64 w-full rounded-[24px] mt-4" /></div>;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10" style={{ paddingTop: "100px" }}>
      {/* Top: JD + controls */}
      <div className="rounded-[24px] bg-white p-5 mb-6 flex gap-4 items-start" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
        <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste job description..." className="flex-1 rounded-[16px] border p-4 text-[13px] text-[#08304c] outline-none resize-y min-h-[100px]" style={{ borderColor: "oklab(0 0 0 / 0.08)" }} />
        <div className="flex flex-col gap-2 shrink-0">
          <div style={{ fontSize: "12px", color: Muted, textAlign: "right" }}>{experiences?.length ?? 0} exp · {skills?.length ?? 0} skills</div>
          {ats > 0 && <ATSScore score={ats} />}
        </div>
      </div>

      {/* 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[42%_58%] gap-6 items-start">
        {/* === LEFT: Accordions === */}
        <div className="space-y-4">

          {/* ── Summary ── */}
          <AccordionSection title="Professional Summary" badge={sumV ? "ready" : undefined}>
            <Button variant="outline" size="sm" onClick={genSummary} disabled={sumLoad}>{sumLoad ? "Generating..." : "Generate 3 Variants"}</Button>
            {sumLoad && <Skeleton className="h-24 rounded-[16px] mt-3" />}
            {!sumLoad && sumV && sumV.filter(Boolean).map((v, i) => (
              <div key={i} className="mt-2"><VariantCard variant={v} rank={i + 1} selected={sumSel === i} onSelect={() => { setSumSel(i); setSumEdit(null); }} onEdit={(t) => setSumEdit(t)} onRegenerate={regenSum} /></div>
            ))}
          </AccordionSection>

          {/* ── Experiences ── */}
          <AccordionSection title="Experiences" badge={expState.filter((e) => e.included).length + "/" + expState.length}>
            <div className="flex gap-2 mb-3">
              <Button variant="outline" size="xs" onClick={genRel}>Analyze Relevance</Button>
            </div>
            {relScores && <div className="flex flex-wrap gap-1.5 mb-3">{relScores.map((r) => (<span key={r.id} className="text-[11px]">{expState.find((e) => e.id === r.id)?.role ?? ""} <RelevanceBadge score={r.score} /></span>))}</div>}
            {expState.map((e) => {
              const rel = relScores?.find((r) => r.id === e.id);
              return (
                <div key={e.id} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={e.included} onChange={() => setExpState((p) => p.map((x) => x.id === e.id ? { ...x, included: !x.included } : x))} />
                      <span style={{ fontSize: "13px", color: Ink, fontWeight: 500 }}>{e.role} at {e.company}</span>
                      {rel && <RelevanceBadge score={rel.score} />}
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => genExp(e.id)} disabled={e.loading}>{e.loading ? "..." : "Generate 3"}</Button>
                  </div>
                  {e.included && e.variants && !e.loading && e.variants.filter(Boolean).map((v: any, i: number) => (
                    <div key={i} className="ml-6 mb-1"><VariantCard variant={v} rank={i + 1} selected={e.selVar === i} onSelect={() => setExpState((p) => p.map((x) => x.id === e.id ? { ...x, selVar: i, edit: null } : x))} onEdit={(t) => setExpState((p) => p.map((x) => x.id === e.id ? { ...x, edit: t } : x))} onRegenerate={(ctx) => regenExp(e.id, ctx)} /></div>
                  ))}
                  {e.loading && <Skeleton className="h-16 rounded-[12px] ml-6 mb-2" />}
                </div>
              );
            })}

            {/* Context: add new experience */}
            <ContextInput loading={ctxLoad} bullets={ctxBullets} selectedBullets={ctxSel} onGenerate={genCtx} onToggle={(i) => setCtxSel((p) => p.includes(ctxBullets![i]) ? p.filter((_, j) => j !== i) : [...p, ctxBullets![i]])} />
            {ctxBullets && ctxSel.length > 0 && <Button variant="outline" size="sm" className="mt-2" onClick={addCtxBullets}>Add Selected ({ctxSel.length})</Button>}
          </AccordionSection>

          {/* ── Skills ── */}
          <AccordionSection title="Skills" badge={skillS.filter((s) => s.selected).length + "/" + skillS.length}>
            <Button variant="outline" size="xs" onClick={genSkills} disabled={skLoad}>{skLoad ? "Scoring..." : "Score Against JD"}</Button>
            {skLoad && <Skeleton className="h-12 rounded-[12px] mt-3" />}
            {!skLoad && skillS.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{skillS.map((s) => (<button key={s.id} onClick={() => setSkillS((p) => p.map((x) => x.id === s.id ? { ...x, selected: !x.selected } : x))} className="px-3 py-1.5 rounded-[9999px] text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors flex items-center gap-1" style={{ background: s.selected ? Ink : "#e8f1ff", color: s.selected ? "#fff" : Ink }}>{s.name}{s.matchScore != null && <span style={{ opacity: 0.6, fontSize: "10px", letterSpacing: 0, textTransform: "none" }}>{s.matchScore}%</span>}</button>))}</div>}
            <div className="flex gap-2 mt-3"><Input value={newSk} onChange={(e) => setNewSk(e.target.value)} placeholder="Add skill..." onKeyDown={(e) => { if (e.key === "Enter" && newSk.trim()) { setCustomSk((p) => [...p, { name: newSk.trim() }]); setNewSk(""); } }} /><Button variant="outline" size="sm" onClick={() => { if (newSk.trim()) { setCustomSk((p) => [...p, { name: newSk.trim() }]); setNewSk(""); } }}>Add</Button></div>
          </AccordionSection>
        </div>

        {/* === RIGHT: Preview === */}
        <div className="sticky top-[100px] space-y-4">
          <div className="rounded-[24px] overflow-hidden" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
            <CvPreview data={{
              name: pii.name, email: pii.email, phone: pii.phone, linkedin: pii.linkedin,
              summary: sumText,
              experiences: selExps,
              skills: selSkills,
              educations: (educations ?? []).map((e: any) => ({ institution: e.institution, degree: e.degree, field: e.field, yearStart: e.yearStart, yearEnd: e.yearEnd })),
            }} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={dl}>Download PDF</Button>
            <Button variant="rainbow" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save CV"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
