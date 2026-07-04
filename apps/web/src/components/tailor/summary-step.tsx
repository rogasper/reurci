import { Button } from "@reurci/ui/components/button";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { VariantCard } from "./variant-card";

interface Variant {
  text: string;
  focus?: string;
}

interface Props {
  jd: string;
  loading: boolean;
  variants: Variant[] | null;
  selectedVariant: number | null;
  onSelect: (index: number) => void;
  onEdit: (index: number, text: string) => void;
  onRegenerate: (context: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const textInk = "#08304c";
const textMuted = "#797979";
const cardShadow = "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)";

export function SummaryStep({ variants, selectedVariant, loading, onSelect, onEdit, onRegenerate, onBack, onNext }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: cardShadow }}>
        <h2 style={{ fontSize: "18px", color: textInk, fontWeight: 600, marginBottom: "6px" }}>Professional Summary</h2>
        <p style={{ fontSize: "13px", color: textMuted }}>Choose one of 3 AI-generated summaries. You can edit or regenerate with context.</p>

        {loading && (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-24 rounded-[16px]" />
            <Skeleton className="h-24 rounded-[16px]" />
            <Skeleton className="h-24 rounded-[16px]" />
          </div>
        )}

        {!loading && variants && (
          <div className="mt-4 space-y-2">
            {variants.map((v, i) => (
              <VariantCard
                key={i}
                variant={v}
                rank={i + 1}
                selected={selectedVariant === i}
                onSelect={() => onSelect(i)}
                onEdit={(text) => onEdit(i, text)}
                onRegenerate={(ctx) => onRegenerate(ctx)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back to JD</Button>
        <Button variant="outline" onClick={onNext} disabled={selectedVariant === null || loading}>
          Next: Experiences →
        </Button>
      </div>
    </div>
  );
}
