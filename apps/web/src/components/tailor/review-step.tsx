import { Button } from "@reurci/ui/components/button";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { CvPreview, CvDocument } from "@/components/cv-pdf-template";
import { computeATSScore, ATSScore } from "@/components/ats-score";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";

interface Props {
  summary: string;
  experiences: { company: string; role: string; periodStart: string; periodEnd: string | null; achievements: string[] }[];
  skills: { name: string }[];
  educations: { institution: string; degree: string | null; field: string | null; yearStart: number | null; yearEnd: number | null }[];
  jd: string;
  atsScore: number;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
}

const textInk = "#08304c";
const textMuted = "#797979";
const cardShadow = "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

export function ReviewStep({ summary, experiences, skills, educations, jd, atsScore, saving, onSave, onBack }: Props) {
  const handleDownload = async () => {
    try {
      const blob = await pdf(
        <CvDocument
          data={{
            name: "Your Name", email: "email@example.com", phone: "+62...", linkedin: "linkedin.com/in/...",
            summary, experiences, skills, educations,
          }}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "tailored-cv.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch { toast.error("Download failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-white p-6 flex items-center justify-between" style={{ boxShadow: cardShadow }}>
        <div>
          <h2 style={{ fontSize: "18px", color: textInk, fontWeight: 600 }}>Review & Finalize</h2>
          <p style={{ fontSize: "13px", color: textMuted, marginTop: "4px" }}>
            Summary: {summary.slice(0, 80)}... · {experiences.length} exp · {skills.length} skills
          </p>
        </div>
        <ATSScore score={atsScore} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-[24px] overflow-hidden" style={{ boxShadow: cardShadow }}>
            <CvPreview data={{ name: "Your Name", email: "email@example.com", phone: "+62...", linkedin: "linkedin.com/in/...", summary, experiences, skills, educations }} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-[24px] bg-white p-4" style={{ boxShadow: cardShadow }}>
            <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "4px" }}>Summary</h3>
            <p style={{ fontSize: "12px", color: textMuted }}>{summary}</p>
          </div>
          <div className="rounded-[24px] bg-white p-4" style={{ boxShadow: cardShadow }}>
            <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "4px" }}>Experiences ({experiences.length})</h3>
            <ul style={{ fontSize: "12px", color: textMuted, listStyle: "disc", paddingLeft: "16px" }}>
              {experiences.map((e, i) => <li key={i}>{e.role} at {e.company}</li>)}
            </ul>
          </div>
          <div className="rounded-[24px] bg-white p-4" style={{ boxShadow: cardShadow }}>
            <h3 style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "4px" }}>Skills ({skills.length})</h3>
            <div className="flex flex-wrap gap-1">
              {skills.map((s, i) => (
                <span key={i} className="px-2 py-1 rounded-[9999px] text-[10px] font-semibold" style={{ background: "#e8f1ff", color: textInk }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back: Skills</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>Download PDF</Button>
          <Button variant="rainbow" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save CV Version"}
          </Button>
        </div>
      </div>
    </div>
  );
}
