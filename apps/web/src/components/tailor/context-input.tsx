import { useState } from "react";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";

interface Props {
  loading: boolean;
  bullets: string[] | null;
  selectedBullets: string[];
  onGenerate: (text: string) => void;
  onToggle: (idx: number) => void;
}

const Ink = "#08304c";
const Muted = "#797979";

export function ContextInput({ loading, bullets, selectedBullets, onGenerate, onToggle }: Props) {
  const [text, setText] = useState("");

  return (
    <div className="rounded-[16px] border p-4 mt-3" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
      <p style={{ fontSize: "12px", color: Muted, marginBottom: "8px" }}>Describe experience you'd like to add:</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. I have 3 years of Kubernetes experience, managed 10+ clusters..."
        className="w-full rounded-[12px] border p-3 text-[12px] text-[#08304c] outline-none resize-y min-h-[60px] bg-transparent"
        style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
      />
      <div className="mt-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => { if (text.trim()) onGenerate(text.trim()); }} disabled={loading || !text.trim()}>
          {loading ? "Generating..." : "Generate Bullet Points"}
        </Button>
      </div>

      {loading && <Skeleton className="h-16 rounded-[12px] mt-2" />}

      {bullets && !loading && (
        <div className="mt-3 space-y-1">
          {bullets.map((b, i) => (
            <label key={i} className="flex items-start gap-2 text-xs" style={{ color: Ink, cursor: "pointer" }}>
              <input type="checkbox" checked={selectedBullets.includes(b)} onChange={() => onToggle(i)} className="mt-0.5" />
              {b}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
