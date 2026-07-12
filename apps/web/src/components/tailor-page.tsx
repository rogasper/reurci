import { useMemo, useState } from "react";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { apiPost } from "@/utils/storage";
import { PiiSection } from "@/components/pii-section";
import { useTailor } from "@/hooks/use-tailor";
import { VariantCard } from "@/components/tailor/variant-card";
import { AccordionSection } from "@/components/tailor/accordion-section";
import { RelevanceBadge } from "@/components/tailor/relevance-badge";
import { ContextInput } from "@/components/tailor/context-input";
import { CvPreview, CvDocument } from "@/components/cv-pdf-template";
import { ATSScore } from "@/components/ats-score";
import { CLASSIC_TEMPLATE } from "@/components/templates/john-doe";
import { ReIcon } from "@/components/reicon";
import Reorder from "reicon/icons/Reorder";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const Ink = "#08304c", Muted = "#797979";
const Shadow = "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

interface TailorPageProps {
  userId: string;
  cvId?: string;
  initialSnapshot?: {
    jd: string;
    summary: string;
    experiences: { company: string; role: string; periodStart: string; periodEnd: string | null; achievements: string[] }[];
    skills: { name: string }[];
    _variants?: any;
  };
}

export function TailorPage({ userId, cvId, initialSnapshot }: TailorPageProps) {
  const {
    loaded, jd, setJd, pii, setPii, sumV, sumSel, sumLoad, sumText, sumEdit,
    expState, skillS, customSk, skLoad, relLoad, newSk, setNewSk,
    ctxLoad, ctxBullets, ctxSel, relScores, saving,
    selExps, selSkills, ats,
    educationsData, certificatesData, languagesData, achievementsData, projectsData,
    projRelScores, projRelLoad,
    setSumSel, setSumEdit, generateSummary, regenerateSum,
    getRelevance, generateExp, regenerateExp, generateSkills,
    generateProjectRelevance,
    generateCtx, addCtxBullets, setCtxSel,
    setExpState, setSkillS, setCustomSk, saveVersion, updateVersion, setSaving, setRelScores,
    sectionIncluded, setSectionIncluded, sectionOrder, setSectionOrder,
    coverLetter, clLoad, generateCoverLetter,
  } = useTailor(userId, initialSnapshot, cvId);

  const hasJd = jd.trim().length > 0;

  const save = async () => {
    setSaving(true);
    try {
      const _variants = { sumV, sumSel, expState: expState.map(({ loading, ...rest }) => rest), skillS, customSk, relScores, projRelScores, coverLetter, ctxBullets, ctxSel, sectionIncluded, sectionOrder };
      const base = { jobTitle: jd.slice(0, 100) || "Untitled", jobDescription: jd, cvSnapshot: { summary: sumText, experiences: selExps, skills: selSkills, educations: sectionIncluded.education ? educationsData : [], certificates: sectionIncluded.certifications ? certificatesData : [], languages: sectionIncluded.languages ? languagesData : [], achievements: sectionIncluded.achievements ? achievementsData : [], projects: sectionIncluded.projects ? projectsData : [], sectionOrder, _variants }, atsScore: ats };
      if (cvId) {
        await updateVersion.mutateAsync({ id: cvId, ...base });
      } else {
        await saveVersion.mutateAsync(base);
      }
      toast.success("Saved!");
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  const generateTitle = async () => {
    const exps = expState.filter(e => e.company).map(e => ({ role: e.role, company: e.company }));
    if (exps.length === 0) return null;
    const d = await apiPost<{ title: string }>("/api/ai/tailor/generate-title", { jd, experiences: exps });
    return d.title;
  };

  const dl = async () => {
    try {
      const b = await pdf(<CvDocument data={previewData} />).toBlob();
      const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "cv.pdf"; a.click(); URL.revokeObjectURL(u);
    } catch { toast.error("Download failed"); }
  };

  const toggleSection = (key: string) => {
    setSectionIncluded(p => ({ ...p, [key]: !(p as any)[key] }));
  };

  const handleSectionDrag = (result: any) => {
    if (!result.destination) return;
    const fixed = ["summary"];
    const draggableKeys = sectionOrder.filter(k => !fixed.includes(k));
    const [moved] = draggableKeys.splice(result.source.index, 1);
    draggableKeys.splice(result.destination.index, 0, moved);
    setSectionOrder([...fixed, ...draggableKeys]);
  };

  const showTemplate = !hasJd && sumV === null;

  const groupedSkills = useMemo(() => {
    const map = new Map<string, typeof skillS>();
    for (const s of skillS) {
      const cat = s.category || "Uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    if (customSk.length > 0) {
      const added = map.get("Added") ?? [];
      for (const c of customSk) added.push({ id: `custom-${c.name}`, name: c.name, selected: true, category: "Added" });
      if (added.length > 0) map.set("Added", added);
    }
    const entries = [...map.entries()];
    const uncategorized = entries.find(([k]) => k === "Uncategorized");
    let categorized = entries.filter(([k]) => k !== "Uncategorized" && k !== "Added");
    categorized.sort(([a], [b]) => a.localeCompare(b));
    const added = entries.find(([k]) => k === "Added");
    return [...categorized, ...(uncategorized ? [uncategorized] : []), ...(added ? [added] : [])];
  }, [skillS, customSk]);

  const [categorizing, setCategorizing] = useState(false);
  const uncategorized = skillS.filter(s => !s.category);
  const handleCategorize = async () => {
    if (uncategorized.length === 0) return;
    setCategorizing(true);
    try {
      const res = await apiPost<{ skills: { id: string; name: string; category: string }[] }>("/api/ai/tailor/categorize-skills", { skills: uncategorized.map(s => ({ id: s.id, name: s.name })) });
      const catMap = new Map(res.skills.map(s => [s.id, s.category]));
      setSkillS(p => p.map(s => catMap.has(s.id) ? { ...s, category: catMap.get(s.id) } : s));
      toast.success(`Categorized ${res.skills.length} skills`);
    } catch { toast.error("Categorization failed"); }
    setCategorizing(false);
  };

  const previewData = showTemplate
    ? CLASSIC_TEMPLATE.defaultData as any
    : { name: pii.name, title: pii.title, email: pii.email, phone: pii.phone, linkedin: pii.linkedin, github: pii.github, website: pii.website, summary: sumText, experiences: selExps, skills: selSkills, sectionOrder, educations: sectionIncluded.education ? educationsData : [], certificates: sectionIncluded.certifications ? certificatesData : [], languages: sectionIncluded.languages ? languagesData : [], achievements: sectionIncluded.achievements ? achievementsData : [], projects: sectionIncluded.projects ? projectsData : [] };

  if (!loaded) return <div className="mx-auto px-4 py-10" style={{ paddingTop: "24px" }}><Skeleton className="h-8 w-48 rounded-[16px]" /><Skeleton className="h-64 w-full rounded-[24px] mt-4" /></div>;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10" style={{ paddingTop: "24px" }}>
      <div className="rounded-[24px] bg-white p-5 mb-6 flex gap-4 items-start" style={{ boxShadow: Shadow }}>
        <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste job description..." className="flex-1 rounded-[16px] border p-4 text-[13px] text-[#08304c] outline-none resize-y min-h-[100px]" style={{ borderColor: "oklab(0 0 0 / 0.08)" }} />
        <div className="flex flex-col gap-2 shrink-0" style={{ fontSize: "12px", color: Muted, textAlign: "right" }}>
          <div>{expState.filter(e => e.included).length}/{expState.length} exp · {skillS.filter(s => s.selected).length}/{skillS.length} skills</div>
          {ats > 0 && <ATSScore score={ats} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[42%_58%] gap-6 items-start">
        <div className="space-y-4">
          <PiiSection userId={userId} onUpdate={setPii} generateTitle={generateTitle} />
          <AccordionSection title="Professional Summary" badge={sumV ? "ready" : undefined}>
            {!hasJd && !sumV ? (
              <p style={{ fontSize: "12px", color: Muted }}>Enter a job description above to generate tailored summaries.</p>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={generateSummary} disabled={sumLoad || !hasJd}>{sumLoad ? "Generating..." : "Generate 3 Variants"}</Button>
                {sumLoad && <Skeleton className="h-24 rounded-[16px] mt-3" />}
                {!sumLoad && sumV?.filter(Boolean).map((v, i) => (
                  <div key={i} className="mt-2"><VariantCard variant={v} rank={i + 1} selected={sumSel === i} onSelect={() => { setSumSel(i); setSumEdit(null); }} onEdit={setSumEdit} onRegenerate={regenerateSum as any} /></div>
                ))}
              </>
            )}
          </AccordionSection>

          <DragDropContext onDragEnd={handleSectionDrag}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {sectionOrder.filter(k => k !== "summary").map((key, i) => (
                    <Draggable key={key} draggableId={key} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: (snapshot.isDragging ? 0.85 : (sectionIncluded as any)[key] === false ? 0.45 : 1),
                          }}
                        >
                          {key === "experiences" && (
                            <AccordionSection title="Experiences" badge={expState.filter(e => e.included).length + "/" + expState.length}
                              headerLeft={<div {...provided.dragHandleProps} style={{ cursor: "grab", display: "flex", alignItems: "center", marginRight: "4px" }}><ReIcon icon={Reorder} size={14} color={Muted} /></div>}>
                              {!hasJd ? (
                                <p style={{ fontSize: "12px", color: Muted }}>Enter a job description above to score and rephrase experiences.</p>
                              ) : (
                                <div className="flex gap-2 mb-3">
                                  <Button variant="outline" size="xs" onClick={getRelevance} disabled={relLoad || !hasJd}>{relLoad ? "Analyzing..." : "Analyze Relevance"}</Button>
                                </div>
                              )}
                              {relScores && <div className="flex flex-wrap gap-1.5 mb-3">{relScores.map(r => (<span key={r.id} className="text-[11px]">{expState.find(e => e.id === r.id)?.role} <RelevanceBadge score={r.score} /></span>))}</div>}
                              {expState.map((e) => {
                                const rel = relScores?.find(r => r.id === e.id);
                                return (
                                  <div key={e.id} className="mb-4 last:mb-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={e.included} onChange={() => setExpState(p => p.map(x => x.id === e.id ? { ...x, included: !x.included } : x))} />
                                        <span style={{ fontSize: "13px", color: Ink, fontWeight: 500 }}>{e.role} at {e.company}</span>
                                        {rel && <RelevanceBadge score={rel.score} />}
                                      </div>
                                      <Button variant="ghost" size="xs" onClick={() => generateExp(e.id)} disabled={e.loading || !hasJd}>{e.loading ? "..." : "Generate 3"}</Button>
                                    </div>
                                    {e.included && e.variants && !e.loading && e.variants.filter(Boolean).map((v: any, i: number) => (
                                      <div key={i} className="ml-6 mb-1"><VariantCard variant={v} rank={i + 1} selected={e.selVar === i} onSelect={() => setExpState(p => p.map(x => x.id === e.id ? { ...x, selVar: i, edit: null } : x))} onEdit={(t) => setExpState(p => p.map(x => x.id === e.id ? { ...x, edit: t } : x))} onRegenerate={(ctx) => regenerateExp(e.id, ctx)} /></div>
                                    ))}
                                    {e.loading && <Skeleton className="h-16 rounded-[12px] ml-6 mb-2" />}
                                  </div>
                                );
                              })}
                              {hasJd && (
                                <ContextInput loading={ctxLoad} bullets={ctxBullets} selectedBullets={ctxSel} onGenerate={generateCtx} onToggle={(i) => setCtxSel(p => p.includes(ctxBullets![i]) ? p.filter((_, j) => j !== i) : [...p, ctxBullets![i]])} />
                              )}
                              {ctxBullets && ctxSel.length > 0 && <Button variant="outline" size="sm" className="mt-2" onClick={addCtxBullets}>Add Selected ({ctxSel.length})</Button>}
                            </AccordionSection>
                          )}
                          {key === "skills" && (
                            <AccordionSection title="Skills" badge={skillS.filter(s => s.selected).length + "/" + skillS.length}
                              headerLeft={<div {...provided.dragHandleProps} style={{ cursor: "grab", display: "flex", alignItems: "center", marginRight: "4px" }}><ReIcon icon={Reorder} size={14} color={Muted} /></div>}>
                              {!hasJd ? (
                                <p style={{ fontSize: "12px", color: Muted }}>Enter a job description above to score skills against the role.</p>
                              ) : (
                                <div className="flex gap-2 flex-wrap">
                                  <Button variant="outline" size="xs" onClick={generateSkills} disabled={skLoad || !hasJd}>{skLoad ? "Scoring..." : "Score Against JD"}</Button>
                                  {uncategorized.length > 0 && (
                                    <Button variant="ghost" size="xs" onClick={handleCategorize} disabled={categorizing || !hasJd}>{categorizing ? "..." : "Auto-Categorize"}</Button>
                                  )}
                                </div>
                              )}
                              {skLoad && <Skeleton className="h-12 rounded-[12px] mt-3" />}
                              {!skLoad && skillS.length > 0 && (
                                <div className="space-y-3 mt-3">
                                  {groupedSkills.map(([cat, items]) => (
                                    <div key={cat}>
                                      <div className="mb-1.5" style={{ fontSize: "12px", color: Ink, fontWeight: 600 }}>{cat}</div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {items.map(s => (
                                          <button
                                            key={s.id}
                                            onClick={() => setSkillS(p => p.map(x => x.id === s.id ? { ...x, selected: !x.selected } : x))}
                                            className="px-3 py-1.5 rounded-[9999px] text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors flex items-center gap-1"
                                            style={{ background: s.selected ? Ink : "#e8f1ff", color: s.selected ? "#fff" : Ink }}
                                          >
                                            {s.name}
                                            {s.matchScore != null && (
                                              <span style={{ opacity: 0.6, fontSize: "10px", letterSpacing: 0, textTransform: "none" }}>{s.matchScore}%</span>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2 mt-3"><Input value={newSk} onChange={(e) => setNewSk(e.target.value)} placeholder="Add skill..." onKeyDown={(e) => { if (e.key === "Enter" && newSk.trim()) { setCustomSk(p => [...p, { name: newSk.trim() }]); setNewSk(""); } }} /><Button variant="outline" size="sm" onClick={() => { if (newSk.trim()) { setCustomSk(p => [...p, { name: newSk.trim() }]); setNewSk(""); } }}>Add</Button></div>
                            </AccordionSection>
                          )}
                          {key === "education" && (
                            <AccordionSection title="Education" badge={educationsData.length > 0 ? String(educationsData.length) : undefined} defaultOpen={false}
                              headerLeft={<div {...provided.dragHandleProps} style={{ cursor: "grab", display: "flex", alignItems: "center", marginRight: "4px" }}><ReIcon icon={Reorder} size={14} color={Muted} /></div>}
                              headerRight={<input type="checkbox" checked={sectionIncluded.education} onChange={() => toggleSection("education")} />}>
                              {educationsData.length === 0 ? (
                                <p style={{ fontSize: "12px", color: Muted }}>No education added yet. <a href="/setup" style={{ color: Ink, textDecoration: "underline" }}>Go to Setup</a></p>
                              ) : (
                                <div className="space-y-2">
                                  {educationsData.map((edu, i) => (
                                    <div key={i} className="rounded-[16px] border p-3" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
                                      <div style={{ fontSize: "13px", color: Ink, fontWeight: 500 }}>{edu.institution}</div>
                                      <div style={{ fontSize: "11px", color: Muted, marginTop: "2px" }}>{[edu.degree, edu.field].filter(Boolean).join(" · ")}{(edu.yearStart || edu.yearEnd) && ` · ${edu.yearStart ?? ""}${edu.yearEnd ? ` — ${edu.yearEnd}` : ""}`}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </AccordionSection>
                          )}
                          {key === "certifications" && (
                            <AccordionSection title="Certifications" badge={certificatesData.length > 0 ? String(certificatesData.length) : undefined} defaultOpen={false}
                              headerLeft={<div {...provided.dragHandleProps} style={{ cursor: "grab", display: "flex", alignItems: "center", marginRight: "4px" }}><ReIcon icon={Reorder} size={14} color={Muted} /></div>}
                              headerRight={<input type="checkbox" checked={sectionIncluded.certifications} onChange={() => toggleSection("certifications")} />}>
                              {certificatesData.length === 0 ? (
                                <p style={{ fontSize: "12px", color: Muted }}>No certifications added yet. <a href="/setup" style={{ color: Ink, textDecoration: "underline" }}>Go to Setup</a></p>
                              ) : (
                                <div className="space-y-2">
                                  {certificatesData.map((cert, i) => (
                                    <div key={i} className="rounded-[16px] border p-3" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
                                      <div style={{ fontSize: "13px", color: Ink, fontWeight: 500 }}>{cert.name}</div>
                                      <div style={{ fontSize: "11px", color: Muted, marginTop: "2px" }}>{[cert.issuer, cert.year].filter(Boolean).join(" · ")}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </AccordionSection>
                          )}
                          {key === "languages" && (
                            <AccordionSection title="Languages" badge={languagesData.length > 0 ? String(languagesData.length) : undefined} defaultOpen={false}
                              headerLeft={<div {...provided.dragHandleProps} style={{ cursor: "grab", display: "flex", alignItems: "center", marginRight: "4px" }}><ReIcon icon={Reorder} size={14} color={Muted} /></div>}
                              headerRight={<input type="checkbox" checked={sectionIncluded.languages} onChange={() => toggleSection("languages")} />}>
                              {languagesData.length === 0 ? (
                                <p style={{ fontSize: "12px", color: Muted }}>No languages added yet. <a href="/setup" style={{ color: Ink, textDecoration: "underline" }}>Go to Setup</a></p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {languagesData.map((lang, i) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-[9999px] text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ background: "#e8f1ff", color: Ink }}>{lang.name}{lang.proficiency ? <span style={{ opacity: 0.6, marginLeft: "4px", fontWeight: 400 }}>({lang.proficiency})</span> : null}</span>
                                  ))}
                                </div>
                              )}
                            </AccordionSection>
                          )}
                          {key === "achievements" && (
                            <AccordionSection title="Achievements & Awards" badge={achievementsData.length > 0 ? String(achievementsData.length) : undefined} defaultOpen={false}
                              headerLeft={<div {...provided.dragHandleProps} style={{ cursor: "grab", display: "flex", alignItems: "center", marginRight: "4px" }}><ReIcon icon={Reorder} size={14} color={Muted} /></div>}
                              headerRight={<input type="checkbox" checked={sectionIncluded.achievements} onChange={() => toggleSection("achievements")} />}>
                              {achievementsData.length === 0 ? (
                                <p style={{ fontSize: "12px", color: Muted }}>No achievements added yet. <a href="/setup" style={{ color: Ink, textDecoration: "underline" }}>Go to Setup</a></p>
                              ) : (
                                <div className="space-y-2">
                                  {achievementsData.map((ach, i) => (
                                    <div key={i} className="rounded-[16px] border p-3" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
                                      <div style={{ fontSize: "13px", color: Ink, fontWeight: 500 }}>{ach.title}</div>
                                      <div style={{ fontSize: "11px", color: Muted, marginTop: "2px" }}>{[ach.year, ach.description].filter(Boolean).join(" · ")}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </AccordionSection>
                          )}
                          {key === "projects" && (
                            <AccordionSection title="Projects" badge={projectsData.length > 0 ? String(projectsData.length) : undefined} defaultOpen={false}
                              headerLeft={<div {...provided.dragHandleProps} style={{ cursor: "grab", display: "flex", alignItems: "center", marginRight: "4px" }}><ReIcon icon={Reorder} size={14} color={Muted} /></div>}
                              headerRight={<input type="checkbox" checked={sectionIncluded.projects} onChange={() => toggleSection("projects")} />}>
                              {projectsData.length === 0 ? (
                                <p style={{ fontSize: "12px", color: Muted }}>No projects added yet. <a href="/setup" style={{ color: Ink, textDecoration: "underline" }}>Go to Setup</a></p>
                              ) : (
                                <>
                                  {hasJd && (
                                    <div className="flex gap-2 mb-3">
                                      <Button variant="outline" size="xs" onClick={generateProjectRelevance} disabled={projRelLoad || !hasJd}>{projRelLoad ? "Scoring..." : "Score Projects"}</Button>
                                      {projRelScores && projRelScores.map(s => (<span key={s.id} className="text-xs" style={{ color: s.score >= 80 ? "#00663d" : s.score >= 50 ? "#c77000" : "#cc2300" }}>{s.id}: {s.score}%</span>))}
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    {projectsData.map((proj, i) => (
                                      <div key={i} className="rounded-[16px] border p-3" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
                                        <div className="flex items-center justify-between">
                                          <div style={{ fontSize: "13px", color: Ink, fontWeight: 500 }}>{proj.name}</div>
                                          {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#084e72" }}>Link ↗</a>}
                                        </div>
                                        {proj.description && <div style={{ fontSize: "11px", color: Muted, marginTop: "2px" }}>{proj.description}</div>}
                                        {proj.techStack && proj.techStack.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {proj.techStack.map((t: string, j: number) => (<span key={j} className="px-2 py-0.5 rounded-[9999px] text-[10px] font-semibold" style={{ background: "#e8f1ff", color: Ink }}>{t}</span>))}
                                          </div>
                                        )}
                                        <div style={{ fontSize: "11px", color: Muted, marginTop: "2px" }}>{[proj.year].filter(Boolean).join(" · ")}</div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </AccordionSection>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="sticky top-[24px] space-y-4 p-4">
          <div className="flex gap-2 justify-end flex-wrap">
            <Button variant="outline" size="sm" onClick={dl}>Download PDF</Button>
            <Button variant="outline" size="sm" onClick={generateCoverLetter} disabled={clLoad || !hasJd}>
              {clLoad ? "Generating..." : "Cover Letter"}
            </Button>
            <Button variant="rainbow" size="sm" onClick={save} disabled={saving || !hasJd}>{saving ? "Saving..." : "Save CV"}</Button>
          </div>
          <div className="rounded-[24px] overflow-hidden bg-white" style={{ boxShadow: Shadow }}>
            <CvPreview key={sectionOrder.join(",")} data={previewData} />
          </div>

          {coverLetter && (
            <div className="rounded-[24px] bg-white p-4 mt-4" style={{ boxShadow: Shadow }}>
              <div className="flex items-center justify-between mb-2">
                <h3 style={{ fontSize: "14px", color: Ink, fontWeight: 500 }}>Cover Letter</h3>
                <Button variant="ghost" size="xs" onClick={() => { navigator.clipboard.writeText(coverLetter); toast.success("Copied!"); }}>Copy</Button>
              </div>
              <textarea readOnly value={coverLetter} className="w-full rounded-[16px] border p-4 text-[12px] text-[#08304c] outline-none resize-y h-48 bg-[#f8f9fb]" style={{ borderColor: "oklab(0 0 0 / 0.08)" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
