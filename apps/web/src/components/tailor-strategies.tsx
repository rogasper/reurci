import { useState } from "react";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";

interface Strategy {
  rank: number;
  focus: string;
  summary: string;
  selectedExperienceIds: string[];
  rephrasedAchievements: {
    experienceId: string;
    original: string;
    rephrased: string;
  }[];
  selectedSkillIds: string[];
}

interface Experience {
  id: string;
  company: string;
  role: string;
  periodStart: string;
  periodEnd: string | null;
  description: string | null;
  achievements: string[];
}

interface Skill {
  id: string;
  name: string;
  proficiency: number | null;
}

interface Props {
  strategies: Strategy[];
  experiences: Experience[];
  skills: Skill[];
  onSelectionChange: (data: {
    summary: string;
    selectedExperienceIds: string[];
    selectedSkillIds: string[];
    rephrasedAchievements: {
      experienceId: string;
      original: string;
      rephrased: string;
    }[];
  }) => void;
}

const textInk = "#08304c";
const textMuted = "#797979";
const cardShadow =
  "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

export function TailorStrategies({
  strategies,
  experiences,
  skills,
  onSelectionChange,
}: Props) {
  const [activeStrategy, setActiveStrategy] = useState<number>(0);
  const [summary, setSummary] = useState(strategies[0]?.summary ?? "");
  const [editingSummary, setEditingSummary] = useState(false);
  const [selectedExpIds, setSelectedExpIds] = useState<Set<string>>(
    new Set(strategies[0]?.selectedExperienceIds ?? []),
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(
    new Set(strategies[0]?.selectedSkillIds ?? []),
  );

  const strategy = strategies[activeStrategy];

  const selectStrategy = (idx: number) => {
    setActiveStrategy(idx);
    const s = strategies[idx];
    if (!s) return;
    setSummary(s.summary);
    setSelectedExpIds(new Set(s.selectedExperienceIds));
    setSelectedSkillIds(new Set(s.selectedSkillIds));
    notify(s.summary, s.selectedExperienceIds, s.selectedSkillIds, s.rephrasedAchievements);
  };

  const toggleExp = (id: string) => {
    setSelectedExpIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const notify = (
    s: string,
    eIds: string[],
    skIds: string[],
    rephrased: Strategy["rephrasedAchievements"],
  ) => {
    onSelectionChange({
      summary: s,
      selectedExperienceIds: eIds,
      selectedSkillIds: skIds,
      rephrasedAchievements: rephrased,
    });
  };

  const applyStrategy = (idx: number) => {
    selectStrategy(idx);
  };

  return (
    <div className="space-y-4">
      {/* Strategy selector */}
      <div
        className="rounded-[24px] bg-white p-5"
        style={{ boxShadow: cardShadow }}
      >
        <h3
          style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "12px" }}
        >
          Strategy
        </h3>
        <div className="space-y-2">
          {strategies.map((s, i) => (
            <button
              key={i}
              className={`w-full text-left rounded-[16px] border p-3 transition-colors ${
                activeStrategy === i ? "bg-[#e8f1ff]" : "hover:bg-[#f8f9fb]"
              }`}
              style={{
                borderColor:
                  activeStrategy === i
                    ? "#084e72"
                    : "oklab(0 0 0 / 0.06)",
              }}
              onClick={() => applyStrategy(i)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center size-6 rounded-full text-[11px] font-bold"
                  style={{
                    background:
                      activeStrategy === i ? "#08304c" : "#e8f1ff",
                    color: activeStrategy === i ? "#fff" : textInk,
                  }}
                >
                  {s.rank}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: textInk,
                    fontWeight: 500,
                  }}
                >
                  {s.focus}
                </span>
                {s.rank === 1 && (
                  <span
                    className="rounded-[9999px] px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase font-semibold"
                    style={{
                      background: "#d7ffe2",
                      color: "#08304c",
                    }}
                  >
                    Recommended
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div
        className="rounded-[24px] bg-white p-5"
        style={{ boxShadow: cardShadow }}
      >
        <h3
          style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "8px" }}
        >
          Summary
        </h3>
        {editingSummary ? (
          <div className="space-y-2">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-[16px] border p-3 text-[12px] text-[#08304c] outline-none resize-y"
              style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setEditingSummary(false)}
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setEditingSummary(false);
                  notify(
                    summary,
                    [...selectedExpIds],
                    [...selectedSkillIds],
                    strategy?.rephrasedAchievements ?? [],
                  );
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "12px", color: textMuted, lineHeight: 1.5, marginBottom: "8px" }}>
            {summary || "No summary generated"}
          </p>
        )}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setEditingSummary(true)}
        >
          Edit
        </Button>
      </div>

      {/* Experiences */}
      <div
        className="rounded-[24px] bg-white p-5"
        style={{ boxShadow: cardShadow }}
      >
        <h3
          style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "10px" }}
        >
          Experiences
        </h3>
        <div className="space-y-2">
          {experiences.map((exp) => {
            const checked = selectedExpIds.has(exp.id);
            const rephrased = strategy?.rephrasedAchievements?.filter(
              (r) => r.experienceId === exp.id,
            );
            return (
              <div key={exp.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    toggleExp(exp.id);
                    notify(
                      summary,
                      [...(checked ? selectedExpIds : new Set([...selectedExpIds, exp.id]))],
                      [...selectedSkillIds],
                      strategy?.rephrasedAchievements ?? [],
                    );
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div style={{ fontSize: "12px", color: textInk, fontWeight: 500 }}>
                    {exp.role} — {exp.company}
                  </div>
                  <div style={{ fontSize: "11px", color: textMuted }}>
                    {exp.periodStart} — {exp.periodEnd ?? "Present"}
                  </div>
                  {checked && rephrased && rephrased.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {rephrased.map((r, i) => (
                        <li key={i} style={{ fontSize: "11px", color: "#2c2c2c" }}>
                          • {r.rephrased}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div
        className="rounded-[24px] bg-white p-5"
        style={{ boxShadow: cardShadow }}
      >
        <h3
          style={{ fontSize: "14px", color: textInk, fontWeight: 500, marginBottom: "8px" }}
        >
          Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => {
            const checked = selectedSkillIds.has(s.id);
            return (
              <button
                key={s.id}
                className="px-3 py-1.5 rounded-[9999px] text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors"
                style={{
                  background: checked ? "#08304c" : "#e8f1ff",
                  color: checked ? "#fff" : "#08304c",
                }}
                onClick={() => {
                  toggleSkill(s.id);
                  notify(
                    summary,
                    [...selectedExpIds],
                    [...(checked ? selectedSkillIds : new Set([...selectedSkillIds, s.id]))],
                    strategy?.rephrasedAchievements ?? [],
                  );
                }}
              >
                {s.name}
                {s.proficiency && (
                  <span style={{ opacity: 0.6, letterSpacing: 0, textTransform: "none" }}>
                    {" "}({s.proficiency}/5)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
