import { useState, useEffect } from "react";
import { Button } from "@reurci/ui/components/button";
import { env } from "@reurci/env/web";
import { toast } from "sonner";

export interface ParsedCV {
  experiences: {
    company: string;
    role: string;
    periodStart: string;
    periodEnd?: string;
    description?: string;
    achievements: string[];
  }[];
  skills: { name: string; proficiency?: number }[];
  educations: {
    institution: string;
    degree?: string;
    field?: string;
    yearStart?: number;
    yearEnd?: number;
  }[];
}

interface Props {
  onParsed: (data: ParsedCV) => void;
}

function simpleHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export function CvUploader({ onParsed }: Props) {
  const [rawText, setRawText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [hash, setHash] = useState<string | null>(null);

  // On mount: check if there's a pending/recent parse hash
  useEffect(() => {
    const savedHash = sessionStorage.getItem("reurci:parse-hash");
    if (!savedHash) return;

    setReconnecting(true);
    setHash(savedHash);
    setParsing(true);

    const checkResult = async () => {
      try {
        const res = await fetch(`${env.VITE_SERVER_URL}/api/ai/parse-cv/status/${savedHash}`);
        if (!res.ok) {
          if (res.status === 404) {
            sessionStorage.removeItem("reurci:parse-hash");
            setHash(null); setParsing(false); setReconnecting(false);
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.status === "running") {
          // Still processing — retry in 3s
          setTimeout(checkResult, 3000);
          return;
        }
        if (data.error) {
          toast.error("Previous parse failed. Upload again.");
          sessionStorage.removeItem("reurci:parse-hash");
          setHash(null); setParsing(false); setReconnecting(false);
          return;
        }
        onParsed(data);
        sessionStorage.removeItem("reurci:parse-hash");
        setHash(null); setParsing(false); setReconnecting(false);
        toast.success("CV data loaded!");
      } catch {
        toast.error("Could not reconnect to ongoing parse");
        sessionStorage.removeItem("reurci:parse-hash");
        setHash(null); setParsing(false); setReconnecting(false);
      }
    };

    checkResult();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setRawText("");

    try {
      if (file.name.endsWith(".pdf")) {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).href;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        setRawText(text);
      } else if (file.name.endsWith(".docx")) {
        const mammoth = await import("mammoth/mammoth.browser");
        const result = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer(),
        });
        setRawText(result.value);
      } else {
        toast.error("Unsupported file type. Use PDF or DOCX.");
      }
    } catch (err) {
      console.error("Extraction failed:", err);
      toast.error("Failed to extract text.");
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);

    const h = simpleHash(rawText.slice(0, 5000));
    setHash(h);
    sessionStorage.setItem("reurci:parse-hash", h);

    try {
      const response = await fetch(`${env.VITE_SERVER_URL}/api/ai/parse-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      onParsed(data);
      sessionStorage.removeItem("reurci:parse-hash");
      setHash(null);
      toast.success("CV parsed successfully!");
    } catch (err) {
      console.error("Parse failed:", err);
      toast.error("Failed to parse CV.");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div
      className="rounded-[24px] bg-white p-6"
      style={{
        boxShadow:
          "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>
          Upload Your CV
        </h3>
        <span style={{ fontSize: "11px", color: "#797979" }}>
          PDF or DOCX — all processing happens in your browser
        </span>
      </div>

      {reconnecting && (
        <div className="space-y-4" style={{ minHeight: "80px" }}>
          <div className="animate-pulse rounded-[16px] bg-[#e8f1ff] h-5 w-48" />
          <div className="animate-pulse rounded-[16px] bg-[#e8f1ff] h-3 w-full" />
          <div className="animate-pulse rounded-[16px] bg-[#e8f1ff] h-3 w-3/4" />
          <p style={{ fontSize: "12px", color: "#797979", marginTop: "8px" }}>
            Reconnecting to ongoing CV parsing...
          </p>
        </div>
      )}

      {!reconnecting && (
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("cv-input")?.click()}
            disabled={loading}
          >
            {loading ? "Extracting..." : "Choose File"}
          </Button>
          <input
            id="cv-input"
            type="file"
            accept=".pdf,.docx"
            onChange={handleExtract}
            disabled={loading}
            className="hidden"
          />
          {loading && (
            <span style={{ fontSize: "12px", color: "#797979" }}>
              Extracting text...
            </span>
          )}
        </div>

        {rawText && (
          <>
            <div>
              <textarea
                readOnly
                value={rawText}
                className="w-full rounded-[16px] border p-4 text-[12px] h-40 resize-y bg-[#f8f9fb] text-[#08304c] outline-none"
                style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <p style={{ fontSize: "11px", color: "#797979", marginTop: "4px" }}>
                Raw text extracted from your CV.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleParse} disabled={parsing}>
                {parsing ? "Parsing with AI..." : "Parse with AI"}
              </Button>
            </div>
          </>
        )}

        {parsing && (
          <p style={{ fontSize: "12px", color: "#797979" }}>
            Processing... Don't worry if this takes up to a minute. You can safely refresh the page and it will resume.
          </p>
        )}

        {!rawText && !loading && !parsing && (
          <p style={{ fontSize: "12px", color: "#797979" }}>
            Upload your CV and we'll extract the data for you to review.
          </p>
        )}
      </div>
      )}
    </div>
  );
}
