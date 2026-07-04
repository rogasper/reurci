interface ATSInput {
  jdHardSkills: string[];
  selectedExperiences: {
    description?: string | null;
    achievements: string[];
  }[];
  selectedSkills: { name: string }[];
}

export function computeATSScore({
  jdHardSkills,
  selectedExperiences,
  selectedSkills,
}: ATSInput): number {
  if (jdHardSkills.length === 0) return 0;

  const expText = selectedExperiences
    .map((e) => `${e.description ?? ""} ${e.achievements.join(" ")}`)
    .join(" ")
    .toLowerCase();
  const jdSkillsLower = jdHardSkills.map((s) => s.toLowerCase());

  // 40%: hard skills present in selected skills
  const matchedSkills = jdSkillsLower.filter((js) =>
    selectedSkills.some((sk) => sk.name.toLowerCase().includes(js)),
  );
  const skillsScore = (matchedSkills.length / jdSkillsLower.length) * 40;

  // 30%: keywords found in experience text
  const matchedKeywords = jdSkillsLower.filter((k) => expText.includes(k));
  const keywordScore = (matchedKeywords.length / jdSkillsLower.length) * 30;

  // 15%: format compliance (ATS template → always full)
  const formatScore = 15;

  // 15%: word count (ideal: 300-800)
  const wordCount = expText.split(/\s+/).filter(Boolean).length;
  const lengthScore =
    wordCount >= 300 && wordCount <= 800
      ? 15
      : wordCount < 300
        ? (wordCount / 300) * 15
        : Math.max(0, (1 - (wordCount - 800) / 800)) * 15;

  return Math.round(skillsScore + keywordScore + formatScore + lengthScore);
}

export function ATSScore({ score }: { score: number }) {
  const color =
    score >= 80 ? "#00cc3d" : score >= 60 ? "#ffa130" : "#ff4940";

  return (
    <div
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[9999px] text-[11px] font-semibold tracking-[0.14em] uppercase"
      style={{ background: "#e8f1ff", color: "#08304c" }}
    >
      <span>ATS Score</span>
      <span style={{ color, fontWeight: 700, fontSize: "14px" }}>
        {score}%
      </span>
    </div>
  );
}
