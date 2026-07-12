import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@reurci/ui/components/button";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { toast } from "sonner";
import TemplatePicker from "@/components/template-picker";
import { ReIcon } from "@/components/reicon";
import FileText from "reicon/icons/FileText";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

const Ink = "#08304c";
const Muted = "#797979";
const cardShadow = "0 0 0 1px oklab(0 0 0 / 0.04), 0 8px 8px -4px rgba(0,0,0,0.03), 0 2px 2px -1px rgba(0,0,0,0.03)";

function DashboardPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: versions, isLoading } = useQuery(trpc.cvVersion.list.queryOptions());
  const [showTemplate, setShowTemplate] = useState(false);
  const createProject = useMutation(trpc.cvVersion.create.mutationOptions());

  const handleSelectTemplate = async (templateId: string) => {
    setShowTemplate(false);
    sessionStorage.setItem("reurci:template", templateId);
    sessionStorage.removeItem("reurci:tailor-state");
    try {
      const project = await createProject.mutateAsync({
        jobTitle: "New CV",
        jobDescription: "",
        cvSnapshot: {},
        atsScore: 0,
      });
      navigate({ to: "/tailor/$cvId", params: { cvId: project.id } });
    } catch {
      toast.error("Failed to create project");
    }
  };

  return (
    <div className="px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-semibold leading-tight" style={{ fontSize: "28px", color: Ink, letterSpacing: "-0.5px" }}>
            Workspace
          </h1>
          <p style={{ fontSize: "14px", color: Muted, marginTop: "4px" }}>
            Manage your tailored CVs. Create a new one or revisit existing work.
          </p>
        </div>
        <Button variant="rainbow" size="lg" onClick={() => setShowTemplate(true)} className="px-6">
          + Tambah CV
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-[24px]" />
          ))}
        </div>
      ) : !versions || versions.length === 0 ? (
        <div className="rounded-[24px] bg-white p-12 text-center" style={{ boxShadow: cardShadow }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>
            <ReIcon icon={FileText} size={40} color="#08304c" />
          </div>
          <h2 style={{ fontSize: "18px", color: Ink, fontWeight: 600, marginBottom: "8px" }}>
            No CVs yet
          </h2>
          <p style={{ fontSize: "14px", color: Muted, marginBottom: "24px", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
            Start tailoring your first CV. Upload your resume, paste a job description, and let AI optimize it for you.
          </p>
          <Button variant="rainbow" size="lg" onClick={() => setShowTemplate(true)} className="px-8">
            + Tambah CV Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((v: any) => (
            <Link
              key={v.id}
              to="/tailor/$cvId"
              params={{ cvId: v.id }}
              className="rounded-[24px] bg-white p-5 block transition-colors hover:bg-[#f8f9fb] group"
              style={{ boxShadow: cardShadow }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-10 rounded-[16px] flex items-center justify-center" style={{ background: "#e8f1ff" }}>
                  <ReIcon icon={FileText} size={20} color="#08304c" />
                </div>
                {v.atsScore != null && v.atsScore > 0 && (
                  <span
                    className="rounded-[9999px] px-2.5 py-0.5 text-[10px] tracking-[0.14em] uppercase font-semibold"
                    style={{
                      background: v.atsScore >= 80 ? "#d7ffe2" : v.atsScore >= 50 ? "#ffebd6" : "#ffe8e8",
                      color: v.atsScore >= 80 ? "#00663d" : v.atsScore >= 50 ? "#c77000" : "#cc2300",
                    }}
                  >
                    ATS {v.atsScore}%
                  </span>
                )}
                {(!v.atsScore || v.atsScore === 0) && (
                  <span className="rounded-[9999px] px-2.5 py-0.5 text-[10px] tracking-[0.14em] uppercase font-semibold" style={{ background: "#e8f1ff", color: Ink }}>
                    Draft
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-[15px] truncate" style={{ color: Ink }}>
                  {v.jobTitle || "New CV"}
                </h3>
                <p style={{ fontSize: "11px", color: Muted, opacity: 0.6 }}>
                  {new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center gap-3" style={{ borderColor: "oklab(0 0 0 / 0.06)", fontSize: "12px", color: Muted }}>
                <span className="group-hover:text-[#08304c] transition-colors">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showTemplate && (
        <TemplatePicker
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  );
}
