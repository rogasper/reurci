import { Button } from "@reurci/ui/components/button";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { VariantCard } from "./variant-card";

interface Variant { text: string; original?: string; }
interface ExpEntry {
  id: string; company: string; role: string; included: boolean;
  variants: Variant[] | null; selectedVariant: number | null; editedText: string | null; loading: boolean;
}

interface Props {
  experiences: ExpEntry[];
  onToggle: (id: string) => void;
  onSelectVariant: (id: string, index: number) => void;
  onEdit: (id: string, text: string) => void;
  onRegenerate: (id: string, context: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const textInk = "#08304c";
const textMuted = "#797979";
const cardShadow = "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

export function ExperienceStep({ experiences, onToggle, onSelectVariant, onEdit, onRegenerate, onBack, onNext }: Props) {
  const allDone = experiences.every(e => (e.selectedVariant !== null) || !e.included);

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: cardShadow }}>
        <h2 style={{ fontSize: "18px", color: textInk, fontWeight: 600, marginBottom: "6px" }}>Experiences</h2>
        <p style={{ fontSize: "13px", color: textMuted }}>For each experience, choose the best rephrased version. Uncheck to exclude.</p>

        <div className="mt-4 space-y-4">
          {experiences.map((exp) => (
            <div key={exp.id}>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={exp.included}
                  onChange={() => onToggle(exp.id)}
                  className="mt-1"
                />
                <span style={{ fontSize: "14px", color: textInk, fontWeight: 500 }}>
                  {exp.role} at {exp.company}
                </span>
              </div>

              {exp.included && (
                <>
                  {exp.loading && <Skeleton className="h-24 rounded-[16px]" />}
                  {exp.variants && !exp.loading && (
                    <div className="ml-6 space-y-2">
                      {exp.variants.map((v, i) => (
                        <VariantCard
                          key={i}
                          variant={v}
                          rank={i + 1}
                          selected={exp.selectedVariant === i}
                          onSelect={() => onSelectVariant(exp.id, i)}
                          onEdit={(text) => onEdit(exp.id, text)}
                          onRegenerate={(ctx) => onRegenerate(exp.id, ctx)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back: Summary</Button>
        <Button variant="outline" onClick={onNext} disabled={!allDone}>Next: Skills →</Button>
      </div>
    </div>
  );
}
