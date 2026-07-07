import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Button } from "@reurci/ui/components/button";
import { toast } from "sonner";
import { TailorPage } from "./index";

export const Route = createFileRoute("/_auth/tailor/$cvId")({
  component: TailorEditPage,
});

const Ink = "#08304c";
const Muted = "#797979";

function TailorEditPage() {
  const { cvId } = Route.useParams();
  const trpc = useTRPC();
  const { data: version, isLoading, error } = useQuery(
    trpc.cvVersion.get.queryOptions({ id: cvId }),
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10" style={{ paddingTop: "100px" }}>
        <Skeleton className="h-8 w-48 rounded-[16px]" />
        <Skeleton className="h-64 w-full rounded-[24px] mt-4" />
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10" style={{ paddingTop: "100px" }}>
        <p style={{ color: "#ff4940", fontSize: "13px" }}>Version not found.</p>
        <Link to="/history"><Button variant="ghost" size="sm" className="mt-4">← Back to History</Button></Link>
      </div>
    );
  }

  const snapshot = version.cvSnapshot as any;

  // Build initial snapshot data for the TailorPage
  const initialJd = version.jobDescription ?? "";
  const initialSummary = snapshot?.summary ?? "";
  const initialExperiences = (snapshot?.experiences ?? []).map((e: any) => ({
    company: e.company,
    role: e.role,
    periodStart: e.periodStart,
    periodEnd: e.periodEnd,
    achievements: e.achievements ?? [],
  }));
  const initialSkills = (snapshot?.skills ?? []).map((s: any) => ({ name: s.name }));

  return (
    <div>
      <div className="mx-auto max-w-[1400px] px-4 pt-4" style={{ paddingTop: "80px" }}>
        <div className="flex items-center gap-2 mb-4" style={{ fontSize: "13px", color: Muted }}>
          <Link to="/history" style={{ color: Muted, textDecoration: "underline" }}>History</Link>
          <span>/ Re-edit: {version.jobTitle || "Untitled"}</span>
        </div>
      </div>
      <TailorPage
        initialSnapshot={{
          jd: initialJd,
          summary: initialSummary,
          experiences: initialExperiences,
          skills: initialSkills,
        }}
      />
    </div>
  );
}
