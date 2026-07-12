import { Button } from "@reurci/ui/components/button";
import { TEMPLATES } from "./templates/john-doe";
import { ReIcon } from "@/components/reicon";
import FileText from "reicon/icons/FileText";
import Sparkles from "reicon/icons/Sparkles";

interface Props {
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

const Ink = "#08304c";
const Muted = "#797979";
const cardShadow = "0 0 0 1px oklab(0 0 0 / 0.04), 0 12px 12px -6px rgba(0,0,0,0.04), 0 4px 4px -2px rgba(0,0,0,0.03)";

export default function TemplatePicker({ onSelect, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklab(0 0 0 / 0.4)" }}
      onClick={onClose}
    >
      <div
        className="rounded-[28px] bg-white p-8 max-w-[520px] w-full mx-4"
        style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.06), 0 32px 32px -12px rgba(0,0,0,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold" style={{ fontSize: "20px", color: Ink }}>
            Choose Your Template
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <p style={{ fontSize: "14px", color: Muted, marginBottom: "24px", lineHeight: 1.5 }}>
          Pick a template to start tailoring your CV. Your content will adapt to the chosen layout.
        </p>

        <div className="grid grid-cols-1 gap-4 mb-6">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className="rounded-[24px] border-2 bg-white p-5 text-left transition-all hover:border-[#084e72] hover:bg-[#f0f7ff]"
              style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="size-14 rounded-[18px] flex items-center justify-center shrink-0"
                  style={{ background: "#e8f1ff" }}
                >
                  <ReIcon icon={FileText} size={24} color="#08304c" />
                </div>
                <div>
                  <div className="font-semibold" style={{ fontSize: "15px", color: Ink }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: "12px", color: Muted, marginTop: "2px", lineHeight: 1.4 }}>
                    {template.description}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="rounded-[9999px] px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase" style={{ background: "#d7ffe2", color: Ink }}>
                      ATS Friendly
                    </span>
                    <span className="rounded-[9999px] px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase" style={{ background: "#e8f1ff", color: Ink }}>
                      Single Column
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}

          <div
            className="rounded-[24px] border-2 bg-transparent p-5 opacity-50"
            style={{ borderColor: "oklab(0 0 0 / 0.06)", borderStyle: "dashed" }}
          >
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-[18px] flex items-center justify-center shrink-0" style={{ background: "oklab(0 0 0 / 0.03)" }}>
                <ReIcon icon={Sparkles} size={24} color="oklab(0 0 0 / 0.3)" />
              </div>
              <div>
                <div className="font-semibold" style={{ fontSize: "15px", color: Ink }}>
                  Modern
                </div>
                <div style={{ fontSize: "12px", color: Muted, marginTop: "2px" }}>
                  Coming soon — more layout options in the works.
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
