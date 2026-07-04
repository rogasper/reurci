import { createFileRoute } from "@tanstack/react-router";
import { ExperienceList } from "@/components/experience-crud";
import { SkillList } from "@/components/skill-crud";
import { EducationList } from "@/components/education-crud";
import { PiiSection } from "@/components/pii-section";
import { CvExtractor } from "@/components/cv-extractor";
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@reurci/ui/components/skeleton";

export const Route = createFileRoute("/_auth/setup")({
  component: SetupPage,
});

function SetupPage() {
  const trpc = useTRPC();
  const { data: profile, isLoading } = useQuery(
    trpc.profile.getOrCreate.queryOptions(),
  );

  if (isLoading) {
    return (
      <div
        className="mx-auto max-w-[1200px] px-4 py-10 space-y-6"
        style={{ paddingTop: "100px" }}
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-[24px]" />
        <Skeleton className="h-64 w-full rounded-[24px]" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-[1200px] px-4 py-10 space-y-20"
      style={{ paddingTop: "100px" }}
    >
      <div>
        <h1
          className="font-semibold leading-tight tracking-tight"
          style={{ fontSize: "31px", color: "#08304c" }}
        >
          Setup Your Profile
        </h1>
        <p
          className="mt-1"
          style={{ fontSize: "16px", color: "#797979", lineHeight: 1.5 }}
        >
          Add your experiences, skills, and education. These will be used to
          tailor your CV for each job application.
        </p>
      </div>

      <ExperienceList />
      <SkillList />
      <EducationList />
      <PiiSection />
      <CvExtractor />
    </div>
  );
}
