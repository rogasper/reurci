import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Button } from "@reurci/ui/components/button";

export const Route = createFileRoute("/_auth/history/$cvId")({
  component: HistoryDetailPage,
});

const textInk = "#08304c";
const textMuted = "#797979";
const cardShadow =
  "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

function HistoryDetailPage() {
  const { cvId } = Route.useParams();
  const trpc = useTRPC();
  const { data: version, isLoading, error } = useQuery(
    trpc.cvVersion.get.queryOptions({ id: cvId }),
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10 space-y-6" style={{ paddingTop: "100px" }}>
        <Skeleton className="h-8 w-48 rounded-[16px]" />
        <Skeleton className="h-64 w-full rounded-[24px]" />
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10" style={{ paddingTop: "100px" }}>
        <p style={{ color: "#ff4940", fontSize: "13px" }}>Failed to load version</p>
      </div>
    );
  }

  const snapshot = version.cvSnapshot as any;
  const strategy = version.selectedStrategy as any;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 space-y-8" style={{ paddingTop: "100px" }}>
      <div>
        <h1 className="font-semibold leading-tight tracking-tight" style={{ fontSize: "31px", color: textInk }}>
          {version.jobTitle || "Untitled"}
        </h1>
        <p className="mt-1" style={{ fontSize: "16px", color: textMuted }}>
          {version.companyName && `${version.companyName} · `}
          {new Date(version.createdAt!).toLocaleDateString("id-ID", {
            year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
          {version.atsScore != null && ` · ATS: ${version.atsScore}%`}
        </p>
      </div>

      {snapshot?.summary && (
        <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: cardShadow }}>
          <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "8px" }}>Summary</h3>
          <p style={{ fontSize: "13px", color: "#2c2c2c", lineHeight: 1.6 }}>{snapshot.summary}</p>
        </div>
      )}

      {snapshot?.experiences?.length > 0 && (
        <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: cardShadow }}>
          <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "10px" }}>
            Experiences ({snapshot.experiences.length})
          </h3>
          <div className="space-y-4">
            {snapshot.experiences.map((exp: any, i: number) => (
              <div key={i} className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
                <div style={{ fontSize: "14px", color: textInk, fontWeight: 500 }}>
                  {exp.role} at {exp.company}
                </div>
                <div style={{ fontSize: "12px", color: textMuted, marginTop: "2px" }}>
                  {exp.periodStart}{exp.periodEnd ? ` — ${exp.periodEnd}` : " — Present"}
                </div>
                {exp.achievements?.length > 0 && (
                  <ul className="mt-2 list-disc list-inside" style={{ fontSize: "12px", color: "#2c2c2c" }}>
                    {exp.achievements.map((a: string, j: number) => <li key={j}>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {snapshot?.skills?.length > 0 && (
        <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: cardShadow }}>
          <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "8px" }}>
            Skills ({snapshot.skills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {snapshot.skills.map((s: any, i: number) => (
              <span
                key={i}
                className="px-4 py-2 rounded-[9999px] text-[11px] font-semibold tracking-[0.14em] uppercase"
                style={{ background: "#e8f1ff", color: textInk }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {version.jobDescription && (
        <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: cardShadow }}>
          <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "8px" }}>Job Description</h3>
          <pre style={{ fontSize: "12px", color: textMuted, whiteSpace: "pre-wrap", lineHeight: 1.5, maxHeight: "300px", overflow: "auto" }}>
            {version.jobDescription}
          </pre>
        </div>
      )}
    </div>
  );
}
