import { createFileRoute, Link } from "@tanstack/react-router";
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { Button } from "@reurci/ui/components/button";

export const Route = createFileRoute("/_auth/history/")({
  component: HistoryPage,
});

const textInk = "#08304c";
const textMuted = "#797979";
const cardShadow =
  "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

function HistoryPage() {
  const trpc = useTRPC();
  const { data: versions, isLoading, error } = useQuery(trpc.cvVersion.list.queryOptions());

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10 space-y-6" style={{ paddingTop: "100px" }}>
        <Skeleton className="h-8 w-48 rounded-[16px]" />
        <Skeleton className="h-32 w-full rounded-[24px]" />
        <Skeleton className="h-32 w-full rounded-[24px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10" style={{ paddingTop: "100px" }}>
        <p style={{ color: "#ff4940", fontSize: "13px" }}>Failed to load history</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 space-y-8" style={{ paddingTop: "100px" }}>
      <div>
        <h1 className="font-semibold leading-tight tracking-tight" style={{ fontSize: "31px", color: textInk }}>
          CV History
        </h1>
        <p className="mt-1" style={{ fontSize: "16px", color: textMuted }}>
          Your saved tailored CV versions
        </p>
      </div>

      {(!versions || versions.length === 0) && (
        <Empty>
          <EmptyContent>
            <EmptyTitle>No versions yet</EmptyTitle>
            <EmptyDescription>Tailor a CV and save it to see it here</EmptyDescription>
          </EmptyContent>
        </Empty>
      )}

      <div className="grid gap-4">
        {versions?.map((v) => (
          <div
            key={v.id}
            className="rounded-[24px] bg-white p-6 flex items-center justify-between"
            style={{ boxShadow: cardShadow }}
          >
            <div>
              <div style={{ fontSize: "16px", color: textInk, fontWeight: 500 }}>
                {v.jobTitle || "Untitled"}
              </div>
              <div style={{ fontSize: "12px", color: textMuted, marginTop: "2px" }}>
                {v.companyName && `${v.companyName} · `}
                {new Date(v.createdAt!).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              {v.atsScore != null && (
                <div
                  className="mt-2 inline-flex items-center px-3 py-1 rounded-[9999px] text-[11px] font-semibold tracking-[0.14em] uppercase"
                  style={{ background: "#e8f1ff", color: "#08304c" }}
                >
                  ATS: {v.atsScore}%
                </div>
              )}
            </div>
            <Link to="/history/$cvId" params={{ cvId: v.id }}>
              <Button variant="ghost" size="sm">View</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
