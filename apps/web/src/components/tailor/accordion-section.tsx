import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  badge?: string;
  children: ReactNode;
}

const Ink = "#08304c";
const Muted = "#797979";

export function AccordionSection({ title, defaultOpen, badge, children }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-[24px] bg-white overflow-hidden" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <button
        className="w-full flex items-center justify-between p-5"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Toggle ${title} section`}
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "15px", color: Ink, fontWeight: 600 }}>{title}</span>
          {badge && <span className="rounded-[9999px] px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase font-semibold" style={{ background: "#e8f1ff", color: Ink }}>{badge}</span>}
        </div>
        <span style={{ fontSize: "14px", color: Muted, transform: open ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>▼</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
