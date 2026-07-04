import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { useState } from "react";

interface SkillEntry {
  id: string; name: string; selected: boolean; matchScore?: number; reason?: string;
}

interface Props {
  skills: SkillEntry[] | null;
  loading: boolean;
  onToggle: (id: string) => void;
  onAddCustom: (name: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const textInk = "#08304c";
const textMuted = "#797979";
const cardShadow = "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

export function SkillsStep({ skills, loading, onToggle, onAddCustom, onBack, onNext }: Props) {
  const [newSkill, setNewSkill] = useState("");

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: cardShadow }}>
        <h2 style={{ fontSize: "18px", color: textInk, fontWeight: 600, marginBottom: "6px" }}>Skills</h2>
        <p style={{ fontSize: "13px", color: textMuted }}>Select skills relevant to this job. Skills are scored by JD match.</p>

        {loading && <Skeleton className="h-48 rounded-[16px] mt-4" />}

        {!loading && skills && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((s) => (
              <button
                key={s.id}
                onClick={() => onToggle(s.id)}
                className="px-4 py-2 rounded-[9999px] text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors flex items-center gap-1.5"
                style={{
                  background: s.selected ? textInk : "#e8f1ff",
                  color: s.selected ? "#fff" : textInk,
                }}
              >
                {s.name}
                {s.matchScore != null && (
                  <span style={{ opacity: s.selected ? 0.7 : 0.5, fontSize: "10px" }}>
                    {s.matchScore}%
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add custom skill..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSkill.trim()) {
                onAddCustom(newSkill.trim());
                setNewSkill("");
                e.preventDefault();
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (newSkill.trim()) { onAddCustom(newSkill.trim()); setNewSkill(""); }
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back: Experiences</Button>
        <Button variant="outline" onClick={onNext}>Next: Review →</Button>
      </div>
    </div>
  );
}
