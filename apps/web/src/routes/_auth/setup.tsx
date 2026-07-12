import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExperienceList } from "@/components/experience-crud";
import { SkillList } from "@/components/skill-crud";
import { EducationList } from "@/components/education-crud";
import { CertificateList } from "@/components/certificate-crud";
import { LanguageList } from "@/components/language-crud";
import { AchievementList } from "@/components/achievement-crud";
import { ProjectList } from "@/components/project-crud";
import { PiiSection } from "@/components/pii-section";
import { CvUploader, type ParsedCV } from "@/components/cv-extractor";
import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@reurci/ui/components/button";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/setup")({
  component: SetupPage,
});

const textInk = "#08304c";
const textMuted = "#797979";
const cardShadow =
  "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

function SetupPage() {
  const { session } = Route.useRouteContext();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery(trpc.profile.getOrCreate.queryOptions());

  const [parsedData, setParsedData] = useState<ParsedCV | null>(
    () => {
      try {
        const saved = sessionStorage.getItem("reurci:parsed-cv");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    },
  );
  const [saving, setSaving] = useState(false);

  // Persist parsed data to sessionStorage (survives page refresh)
  useEffect(() => {
    if (parsedData) {
      sessionStorage.setItem("reurci:parsed-cv", JSON.stringify(parsedData));
    }
  }, [parsedData]);

  const createExp = useMutation(trpc.experience.create.mutationOptions());
  const createSkill = useMutation(trpc.skill.create.mutationOptions());
  const createEdu = useMutation(trpc.education.create.mutationOptions());
  const createCert = useMutation(trpc.certificate.create.mutationOptions());

  const handleSaveAll = async () => {
    if (!parsedData) return;
    setSaving(true);
    console.log("[save-all] starting", {
      experiences: parsedData.experiences.length,
      skills: parsedData.skills.length,
      educations: parsedData.educations.length,
      certificates: parsedData.certificates?.length ?? 0,
    });

    // Dedup: fetch existing data from cache to avoid duplicates
    const existingExp: any[] = queryClient.getQueryData(trpc.experience.list.queryOptions().queryKey) ?? [];
    const existingSkills: any[] = queryClient.getQueryData(trpc.skill.list.queryOptions().queryKey) ?? [];
    const existingEdu: any[] = queryClient.getQueryData(trpc.education.list.queryOptions().queryKey) ?? [];
    console.log("[save-all] existing:", { exp: existingExp.length, skills: existingSkills.length, edu: existingEdu.length });

    const existingExpKeys = new Set(existingExp.map((e: any) => `${e.company}|${e.role}`.toLowerCase()));
    const existingSkillNames = new Set(existingSkills.map((s: any) => s.name.toLowerCase()));
    const existingEduKeys = new Set(existingEdu.map((e: any) => e.institution.toLowerCase()));
    const existingCerts: any[] = queryClient.getQueryData(trpc.certificate.list.queryOptions().queryKey) ?? [];
    const existingCertNames = new Set(existingCerts.map((c: any) => c.name.toLowerCase()));

    const toSaveExp = parsedData.experiences
      .filter((e) => { const key = `${String(e.company ?? "")}|${String(e.role ?? "")}`.toLowerCase(); return !existingExpKeys.has(key); });
    const toSaveSkills = parsedData.skills
      .filter((s) => !existingSkillNames.has(s.name.toLowerCase()));
    const toSaveEdu = parsedData.educations
      .filter((e) => !existingEduKeys.has(e.institution.toLowerCase()));
    const toSaveCert = (parsedData.certificates ?? [])
      .filter((c) => !existingCertNames.has(c.name.toLowerCase()));

    const total = parsedData.experiences.length + parsedData.skills.length + parsedData.educations.length + (parsedData.certificates?.length ?? 0);
    const toSave = toSaveExp.length + toSaveSkills.length + toSaveEdu.length + toSaveCert.length;
    const skipped = total - toSave;

    console.log("[save-all] to save:", { exp: toSaveExp.length, skills: toSaveSkills.length, edu: toSaveEdu.length, skipped });

    const results = await Promise.allSettled([
      ...toSaveExp.map((exp) =>
        createExp.mutateAsync({
          company: String(exp.company ?? "").trim(),
          role: String(exp.role ?? "").trim(),
          periodStart: exp.periodStart ? String(exp.periodStart) : undefined,
          periodEnd: exp.periodEnd ? String(exp.periodEnd) : undefined,
          description: exp.description ? String(exp.description) : undefined,
          achievements: Array.isArray(exp.achievements) ? exp.achievements.filter(Boolean) : undefined,
        })
      ),
      ...toSaveSkills.map((sk) =>
        createSkill.mutateAsync({ name: sk.name, proficiency: sk.proficiency })
      ),
      ...toSaveEdu.map((edu) =>
        createEdu.mutateAsync({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          yearStart: edu.yearStart,
          yearEnd: edu.yearEnd,
        })
      ),
      ...toSaveCert.map((cert) =>
        createCert.mutateAsync({
          name: cert.name,
          issuer: cert.issuer,
          year: cert.year,
        })
      ),
    ]);

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.filter((r) => r.status === "rejected").length;
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error("[save-all] item", i, "failed:", r.reason);
    });

    queryClient.invalidateQueries(trpc.experience.list.queryFilter());
    queryClient.invalidateQueries(trpc.skill.list.queryFilter());
    queryClient.invalidateQueries(trpc.education.list.queryFilter());
    queryClient.invalidateQueries(trpc.certificate.list.queryFilter());

    console.log("[save-all] done", results);

    if (fail > 0) {
      toast.success(`Saved ${ok} items, ${fail} failed, ${skipped} skipped`);
    } else if (skipped > 0) {
      toast.success(`Saved ${ok} new item(s), ${skipped} already existed`);
    } else {
      toast.success(`All ${ok} items saved`);
    }

    setSaving(false);
    setParsedData(null);
    sessionStorage.removeItem("reurci:parsed-cv");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10 space-y-6" style={{ paddingTop: "100px" }}>
        <Skeleton className="h-8 w-48 rounded-[16px]" />
        <Skeleton className="h-64 w-full rounded-[24px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 space-y-20" style={{ paddingTop: "100px" }}>
      <div>
        <h1 className="font-semibold leading-tight tracking-tight" style={{ fontSize: "31px", color: textInk }}>
          Setup Your Profile
        </h1>
        <p className="mt-1" style={{ fontSize: "16px", color: textMuted, lineHeight: 1.5 }}>
          Upload your CV and we'll parse it automatically. Review the data, fix anything wrong, then save.
        </p>
      </div>

      {/* Step 1: Upload CV */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center size-7 rounded-full text-xs font-bold text-white" style={{ background: textInk }}>
            1
          </span>
          <span style={{ fontSize: "14px", color: textInk, fontWeight: 500 }}>Upload & Parse CV</span>
        </div>
        <CvUploader onParsed={setParsedData} />
      </div>

      {/* Step 2: Review parsed data */}
      {parsedData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-7 rounded-full text-xs font-bold text-white" style={{ background: textInk }}>
              2
            </span>
            <span style={{ fontSize: "14px", color: textInk, fontWeight: 500 }}>Review & Save</span>
          </div>

          {parsedData.experiences.length > 0 && (
            <div className="rounded-[24px] bg-white p-5" style={{ boxShadow: cardShadow }}>
              <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "10px" }}>
                Experiences ({parsedData.experiences.length})
              </h3>
              <div className="space-y-3">
                {parsedData.experiences.map((exp, i) => (
                  <div key={i} className="flex items-start justify-between rounded-[16px] border p-3" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
                    <div>
                      <div style={{ fontSize: "13px", color: textInk, fontWeight: 500 }}>
                        {exp.role} at {exp.company}
                      </div>
                      <div style={{ fontSize: "11px", color: textMuted }}>
                        {exp.periodStart}{exp.periodEnd ? ` — ${exp.periodEnd}` : " — Present"}
                      </div>
                      {exp.achievements.length > 0 && (
                        <ul className="mt-1 list-disc list-inside" style={{ fontSize: "11px", color: "#2c2c2c" }}>
                          {exp.achievements.map((a, j) => <li key={j}>{a}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedData.skills.length > 0 && (
            <div className="rounded-[24px] bg-white p-5" style={{ boxShadow: cardShadow }}>
              <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "10px" }}>
                Skills ({parsedData.skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((sk, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-4 py-2 rounded-[9999px] text-[11px] font-semibold tracking-[0.14em] uppercase"
                    style={{ background: "#e8f1ff", color: textInk }}
                  >
                    {sk.name}
                    {sk.proficiency && <span style={{ opacity: 0.6, letterSpacing: 0, textTransform: "none" }}> ({sk.proficiency}/5)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsedData.educations.length > 0 && (
            <div className="rounded-[24px] bg-white p-5" style={{ boxShadow: cardShadow }}>
              <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "10px" }}>
                Education ({parsedData.educations.length})
              </h3>
              <div className="space-y-3">
                {parsedData.educations.map((edu, i) => (
                  <div key={i} className="rounded-[16px] border p-3" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
                    <div style={{ fontSize: "13px", color: textInk, fontWeight: 500 }}>{edu.institution}</div>
                    <div style={{ fontSize: "11px", color: textMuted, marginTop: "2px" }}>
                      {[edu.degree, edu.field].filter(Boolean).join(" · ")}
                      {(edu.yearStart || edu.yearEnd) && ` · ${edu.yearStart ?? ""}${edu.yearEnd ? ` — ${edu.yearEnd}` : ""}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setParsedData(null)}>Discard</Button>
            <Button variant="rainbow" size="sm" onClick={handleSaveAll} disabled={saving}>
              {saving ? "Saving..." : `Save All (${parsedData.experiences.length + parsedData.skills.length + parsedData.educations.length} items)`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Edit saved data (hidden while reviewing parsed CV) */}
      {!parsedData && (
        <>
          <ExperienceList />
          <SkillList />
          <EducationList />
          <CertificateList />
          <LanguageList />
          <AchievementList />
          <ProjectList />
        </>
      )}

      <PiiSection userId={session.data?.user.id ?? ""} />

      {!parsedData && (
        <div className="flex justify-center pt-4">
          <Link to="/dashboard">
            <Button variant="rainbow" size="lg" className="px-8">
              Continue to Workspace →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
