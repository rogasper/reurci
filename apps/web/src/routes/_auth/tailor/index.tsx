import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { useTailor } from "@/hooks/use-tailor";
import { VariantCard } from "@/components/tailor/variant-card";
import { AccordionSection } from "@/components/tailor/accordion-section";
import { RelevanceBadge } from "@/components/tailor/relevance-badge";
import { ContextInput } from "@/components/tailor/context-input";
import { CvPreview, CvDocument } from "@/components/cv-pdf-template";
import { ATSScore } from "@/components/ats-score";

export const Route = createFileRoute("/_auth/tailor/")({ component: TailorPage });

const Ink = "#08304c", Muted = "#797979";
const Shadow = "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

interface TailorPageProps {
  initialSnapshot?: {
    jd: string;
    summary: string;
    experiences: { company: string; role: string; periodStart: string; periodEnd: string | null; achievements: string[] }[];
    skills: { name: string }[];
  };
}

export function TailorPage({ initialSnapshot }: TailorPageProps = {}) {
  const { session } = Route.useRouteContext();
  const uid = session.data?.user.id ?? "";
  const {
    loaded, jd, setJd, pii, sumV, sumSel, sumLoad, sumText, sumEdit,
    expState, skillS, customSk, skLoad, newSk, setNewSk,
    ctxLoad, ctxBullets, ctxSel, relScores, saving,
    selExps, selSkills, ats, educationsData,
    setSumSel, setSumEdit, generateSummary, regenerateSum,
    getRelevance, generateExp, regenerateExp, generateSkills,
    generateCtx, addCtxBullets, setCtxSel,
    setExpState, setSkillS, setCustomSk, saveVersion, setSaving, setRelScores,
    coverLetter, clLoad, generateCoverLetter,
  } = useTailor(uid, initialSnapshot);

  const save = async () => {
    setSaving(true);
    try {
      await saveVersion.mutateAsync({
        jobTitle: jd.slice(0, 100) || "Untitled", jobDescription: jd,
        cvSnapshot: { summary: sumText, experiences: selExps, skills: selSkills, educations: educationsData },
        atsScore: ats,
      });
      toast.success("Saved!");
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  const dl = async () => {
    try {
      const b = await pdf(<CvDocument data={{ name: pii.name, email: pii.email, phone: pii.phone, linkedin: pii.linkedin, summary: sumText, experiences: selExps, skills: selSkills, educations: educationsData }} />).toBlob();
      const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "cv.pdf"; a.click(); URL.revokeObjectURL(u);
    } catch { toast.error("Download failed"); }
  };

  if (!loaded) return <div className="mx-auto max-w-[1400px] px-4 py-10" style={{ paddingTop: "100px" }}><Skeleton className="h-8 w-48 rounded-[16px]" /><Skeleton className="h-64 w-full rounded-[24px] mt-4" /></div>;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10" style={{ paddingTop: "100px" }}>
      {/* Top bar */}
      <div className="rounded-[24px] bg-white p-5 mb-6 flex gap-4 items-start" style={{ boxShadow: Shadow }}>
        <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste job description..." className="flex-1 rounded-[16px] border p-4 text-[13px] text-[#08304c] outline-none resize-y min-h-[100px]" style={{ borderColor: "oklab(0 0 0 / 0.08)" }} />
        <div className="flex flex-col gap-2 shrink-0" style={{ fontSize: "12px", color: Muted, textAlign: "right" }}>
          <div>{expState.filter(e => e.included).length}/{expState.length} exp · {skillS.filter(s => s.selected).length}/{skillS.length} skills</div>
          {ats > 0 && <ATSScore score={ats} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[42%_58%] gap-6 items-start">
        {/* LEFT */}
        <div className="space-y-4">
          <AccordionSection title="Professional Summary" badge={sumV ? "ready" : undefined}>
            <Button variant="outline" size="sm" onClick={generateSummary} disabled={sumLoad}>{sumLoad ? "Generating..." : "Generate 3 Variants"}</Button>
            {sumLoad && <Skeleton className="h-24 rounded-[16px] mt-3" />}
            {!sumLoad && sumV?.filter(Boolean).map((v, i) => (
              <div key={i} className="mt-2"><VariantCard variant={v} rank={i + 1} selected={sumSel === i} onSelect={() => { setSumSel(i); setSumEdit(null); }} onEdit={setSumEdit} onRegenerate={regenerateSum as any} /></div>
            ))}
          </AccordionSection>

          <AccordionSection title="Experiences" badge={expState.filter(e => e.included).length + "/" + expState.length}>
            <div className="flex gap-2 mb-3">
              <Button variant="outline" size="xs" onClick={getRelevance}>Analyze Relevance</Button>
            </div>
            {relScores && <div className="flex flex-wrap gap-1.5 mb-3">{relScores.map(r => (<span key={r.id} className="text-[11px]">{expState.find(e => e.id === r.id)?.role} <RelevanceBadge score={r.score} /></span>))}</div>}
            {expState.map(e => {
              const rel = relScores?.find(r => r.id === e.id);
              return (
                <div key={e.id} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={e.included} onChange={() => setExpState(p => p.map(x => x.id === e.id ? { ...x, included: !x.included } : x))} />
                      <span style={{ fontSize: "13px", color: Ink, fontWeight: 500 }}>{e.role} at {e.company}</span>
                      {rel && <RelevanceBadge score={rel.score} />}
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => generateExp(e.id)} disabled={e.loading}>{e.loading ? "..." : "Generate 3"}</Button>
                  </div>
                  {e.included && e.variants && !e.loading && e.variants.filter(Boolean).map((v: any, i: number) => (
                    <div key={i} className="ml-6 mb-1"><VariantCard variant={v} rank={i + 1} selected={e.selVar === i} onSelect={() => setExpState(p => p.map(x => x.id === e.id ? { ...x, selVar: i, edit: null } : x))} onEdit={(t) => setExpState(p => p.map(x => x.id === e.id ? { ...x, edit: t } : x))} onRegenerate={(ctx) => regenerateExp(e.id, ctx)} /></div>
                  ))}
                  {e.loading && <Skeleton className="h-16 rounded-[12px] ml-6 mb-2" />}
                </div>
              );
            })}
            <ContextInput loading={ctxLoad} bullets={ctxBullets} selectedBullets={ctxSel} onGenerate={generateCtx} onToggle={(i) => setCtxSel(p => p.includes(ctxBullets![i]) ? p.filter((_, j) => j !== i) : [...p, ctxBullets![i]])} />
            {ctxBullets && ctxSel.length > 0 && <Button variant="outline" size="sm" className="mt-2" onClick={addCtxBullets}>Add Selected ({ctxSel.length})</Button>}
          </AccordionSection>

          <AccordionSection title="Skills" badge={skillS.filter(s => s.selected).length + "/" + skillS.length}>
            <Button variant="outline" size="xs" onClick={generateSkills} disabled={skLoad}>{skLoad ? "Scoring..." : "Score Against JD"}</Button>
            {skLoad && <Skeleton className="h-12 rounded-[12px] mt-3" />}
            {!skLoad && skillS.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{skillS.map(s => (<button key={s.id} onClick={() => setSkillS(p => p.map(x => x.id === s.id ? { ...x, selected: !x.selected } : x))} className="px-3 py-1.5 rounded-[9999px] text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors flex items-center gap-1" style={{ background: s.selected ? Ink : "#e8f1ff", color: s.selected ? "#fff" : Ink }}>{s.name}{s.matchScore != null && <span style={{ opacity: 0.6, fontSize: "10px", letterSpacing: 0, textTransform: "none" }}>{s.matchScore}%</span>}</button>))}</div>}
            <div className="flex gap-2 mt-3"><Input value={newSk} onChange={(e) => setNewSk(e.target.value)} placeholder="Add skill..." onKeyDown={(e) => { if (e.key === "Enter" && newSk.trim()) { setCustomSk(p => [...p, { name: newSk.trim() }]); setNewSk(""); } }} /><Button variant="outline" size="sm" onClick={() => { if (newSk.trim()) { setCustomSk(p => [...p, { name: newSk.trim() }]); setNewSk(""); } }}>Add</Button></div>
          </AccordionSection>
        </div>

        {/* RIGHT: Preview */}
        <div className="sticky top-[100px] space-y-4">
          <div className="rounded-[24px] overflow-hidden" style={{ boxShadow: Shadow }}>
            <CvPreview data={{ name: pii.name, email: pii.email, phone: pii.phone, linkedin: pii.linkedin, summary: sumText, experiences: selExps, skills: selSkills, educations: educationsData }} />
          </div>
          <div className="flex gap-2 justify-end flex-wrap">
            <Button variant="outline" size="sm" onClick={dl}>Download PDF</Button>
            <Button variant="outline" size="sm" onClick={generateCoverLetter} disabled={clLoad}>
              {clLoad ? "Generating..." : "Cover Letter"}
            </Button>
            <Button variant="rainbow" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save CV"}</Button>
          </div>
          {coverLetter && (
            <div className="rounded-[24px] bg-white p-4 mt-4" style={{ boxShadow: Shadow }}>
              <div className="flex items-center justify-between mb-2">
                <h3 style={{ fontSize: "14px", color: Ink, fontWeight: 500 }}>Cover Letter</h3>
                <Button variant="ghost" size="xs" onClick={() => {
                  navigator.clipboard.writeText(coverLetter);
                  toast.success("Copied!");
                }}>Copy</Button>
              </div>
              <textarea
                readOnly
                value={coverLetter}
                className="w-full rounded-[16px] border p-4 text-[12px] text-[#08304c] outline-none resize-y h-48 bg-[#f8f9fb]"
                style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
