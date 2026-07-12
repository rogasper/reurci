import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Button } from "@reurci/ui/components/button";
import { TailorPage } from "@/components/tailor-page";

export const Route = createFileRoute("/_auth/tailor/$cvId")({
  component: TailorEditPage,
});

const Ink = "#08304c";
const Muted = "#797979";

function TailorEditPage() {
  const { cvId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const trpc = useTRPC();

  const { data: version, isLoading, error } = useQuery(
    trpc.cvVersion.get.queryOptions({ id: cvId }),
  );

  const { data: experiences } = useQuery(trpc.experience.list.queryOptions());
  const { data: skills } = useQuery(trpc.skill.list.queryOptions());

  if (isLoading || !experiences || !skills) {
    return (
      <div className="mx-auto px-4 py-10" style={{ paddingTop: "24px" }}>
        <Skeleton className="h-8 w-48 rounded-[16px]" />
        <Skeleton className="h-64 w-full rounded-[24px] mt-4" />
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10" style={{ paddingTop: "24px" }}>
        <p style={{ color: "#ff4940", fontSize: "13px" }}>Project not found.</p>
        <Link to="/dashboard"><Button variant="ghost" size="sm" className="mt-4">← Back to Workspace</Button></Link>
      </div>
    );
  }

  const snapshot = version.cvSnapshot as any;
  const isNewProject = !version.jobDescription;

  const initialJd = version.jobDescription ?? "";
  const initialSummary = snapshot?.summary ?? "";
  const initialExperiences = isNewProject
    ? experiences.map((e: any) => ({
        company: e.company,
        role: e.role,
        periodStart: e.periodStart,
        periodEnd: e.periodEnd,
        achievements: e.achievements ?? [],
      }))
    : (snapshot?.experiences ?? []).map((e: any) => ({
        company: e.company,
        role: e.role,
        periodStart: e.periodStart,
        periodEnd: e.periodEnd,
        achievements: e.achievements ?? [],
      }));
  const initialSkills = isNewProject
    ? skills.map((s: any) => ({ name: s.name }))
    : (snapshot?.skills ?? []).map((s: any) => ({ name: s.name }));

  return (
    <div>
      <div className="mx-auto max-w-[1400px] px-4 pt-4" style={{ paddingTop: "24px" }}>
        <div className="flex items-center gap-2 mb-4" style={{ fontSize: "13px", color: Muted }}>
          <Link to="/dashboard" style={{ color: Muted, textDecoration: "underline" }}>Workspace</Link>
          <span>/ {version.jobTitle || "New CV"}</span>
        </div>
      </div>
      <TailorPage
        userId={session.data?.user.id ?? ""}
        cvId={cvId}
        initialSnapshot={
          isNewProject
            ? undefined
            : {
                jd: initialJd,
                summary: initialSummary,
                experiences: initialExperiences,
                skills: initialSkills,
                _variants: snapshot?._variants,
              }
        }
      />
    </div>
  );
}
