import type { IconFunction } from "reicon/createIcon";

interface Props {
  icon: IconFunction;
  size?: number;
  color?: string;
  className?: string;
}

export function ReIcon({ icon, size = 18, color, className }: Props) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", lineHeight: 0 }}
      dangerouslySetInnerHTML={{
        __html: icon.toSvg({ size, color: color ?? "currentColor" }),
      }}
    />
  );
}
