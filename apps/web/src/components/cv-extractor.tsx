import { useState } from "react";
import { Button } from "@reurci/ui/components/button";
import { toast } from "sonner";

export function CvExtractor() {
  const [extractedText, setExtractedText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setExtractedText("");
    try {
      if (file.name.endsWith(".pdf")) {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        setExtractedText(text);
      } else if (file.name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setExtractedText(result.value);
      } else {
        toast.error("Unsupported file type. Use PDF or DOCX.");
      }
    } catch {
      toast.error("Failed to extract text. Try copy-pasting manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>Upload CV (optional)</h3>
        <span style={{ fontSize: "11px", color: "#797979" }}>Extract raw text to copy-paste into forms above</span>
      </div>

      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => document.getElementById("cv-file-input")?.click()} disabled={loading}>
          Choose File
        </Button>
        <input id="cv-file-input" type="file" accept=".pdf,.docx" onChange={handleFile} disabled={loading} className="hidden" />

        {loading && <div style={{ fontSize: "12px", color: "#797979" }}>Extracting text...</div>}

        {extractedText && (
          <div>
            <div style={{ fontSize: "12px", color: "#08304c", fontWeight: 500, marginBottom: "6px" }}>Extracted Text:</div>
            <textarea
              readOnly
              value={extractedText}
              className="w-full rounded-[16px] border p-4 text-[12px] h-48 resize-y bg-[#f8f9fb] text-[#08304c] outline-none"
              style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p style={{ fontSize: "11px", color: "#797979", marginTop: "4px" }}>
              Click to select all, then copy-paste into the experience/skills sections
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
