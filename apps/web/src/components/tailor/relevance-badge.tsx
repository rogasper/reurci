interface Props {
  score: number;
}

export function RelevanceBadge({ score }: Props) {
  const color = score >= 80 ? "#00cc3d" : score >= 50 ? "#ffa130" : "#ff4940";
  const label = score >= 80 ? "High" : score >= 50 ? "Medium" : "Low";
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase" style={{ color }}>
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label} {score}%
    </span>
  );
}
