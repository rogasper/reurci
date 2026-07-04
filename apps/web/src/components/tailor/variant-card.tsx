import { Button } from "@reurci/ui/components/button";
import { useState } from "react";

interface Variant {
  text: string;
  focus?: string;
  original?: string;
}

interface Props {
  variant: Variant;
  rank: number;
  selected: boolean;
  onSelect: () => void;
  onEdit?: (text: string) => void;
  onRegenerate?: (context: string) => void;
}

const textInk = "#08304c";
const textMuted = "#797979";

export function VariantCard({ variant, rank, selected, onSelect, onEdit, onRegenerate }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(variant?.text ?? "");
  const [regenerating, setRegenerating] = useState(false);
  const [contextInput, setContextInput] = useState("");

  return (
    <div
      className={`rounded-[16px] border p-4 transition-colors ${
        selected ? "bg-[#e8f1ff]" : "hover:bg-[#f8f9fb]"
      }`}
      style={{
        borderColor: selected ? "#084e72" : "oklab(0 0 0 / 0.06)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex items-center justify-center size-6 rounded-full text-[11px] font-bold"
          style={{
            background: selected ? textInk : "#e8f1ff",
            color: selected ? "#fff" : textInk,
          }}
        >
          {rank}
        </span>
        <span style={{ fontSize: "13px", color: textInk, fontWeight: 500 }}>
          {variant?.focus ?? `Option ${rank}`}
        </span>
        {rank === 1 && (
          <span
            className="rounded-[9999px] px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase font-semibold"
            style={{ background: "#d7ffe2", color: textInk }}
          >
            Recommended
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full rounded-[12px] border p-3 text-[12px] text-[#08304c] outline-none resize-y"
            style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
            rows={4}
          />
          <div className="flex gap-1">
            <Button variant="ghost" size="xs" onClick={() => { setEditing(false); onEdit?.(editText); }}>
              Done
            </Button>
            <Button variant="ghost" size="xs" onClick={() => { setEditing(false); setEditText(variant?.text ?? ""); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2" style={{ fontSize: "12px", color: "#2c2c2c", lineHeight: 1.5 }}>
            {(variant?.text ?? "").split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="flex gap-1.5 mb-1">
                <span style={{ color: "#797979" }}>•</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button variant="ghost" size="xs" onClick={onSelect}>
              {selected ? "Selected" : "Use"}
            </Button>
            {onEdit && <Button variant="ghost" size="xs" onClick={() => setEditing(true)}>Edit</Button>}
            {onRegenerate && (
              <Button variant="ghost" size="xs" onClick={() => setRegenerating(!regenerating)}>
                Regenerate
              </Button>
            )}
          </div>
        </>
      )}

      {regenerating && (
        <div className="mt-2 flex gap-1">
          <input
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
            placeholder="Add context to improve..."
            className="flex-1 rounded-[12px] border p-2 text-[11px] text-[#08304c] outline-none"
            style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
          />
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              if (contextInput.trim()) {
                onRegenerate(contextInput.trim());
                setContextInput("");
                setRegenerating(false);
              }
            }}
          >
            Go
          </Button>
        </div>
      )}
    </div>
  );
}
