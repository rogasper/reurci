import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { toast } from "sonner";

function EduForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: {
    id: string;
    institution: string;
    degree: string | null;
    field: string | null;
    yearStart: number | null;
    yearEnd: number | null;
  };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [institution, setInstitution] = useState(initial?.institution ?? "");
  const [degree, setDegree] = useState(initial?.degree ?? "");
  const [field, setField] = useState(initial?.field ?? "");
  const [yearStart, setYearStart] = useState(initial?.yearStart?.toString() ?? "");
  const [yearEnd, setYearEnd] = useState(initial?.yearEnd?.toString() ?? "");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.education.create.mutationOptions());
  const updateMut = useMutation(trpc.education.update.mutationOptions());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      institution,
      degree: degree || undefined,
      field: field || undefined,
      yearStart: yearStart ? Number(yearStart) : undefined,
      yearEnd: yearEnd ? Number(yearEnd) : undefined,
    };
    if (initial) {
      await updateMut.mutateAsync({ id: initial.id, ...data }, { onError: (err) => toast.error(err.message) });
    } else {
      await createMut.mutateAsync(data, { onError: (err) => toast.error(err.message) });
    }
    queryClient.invalidateQueries(trpc.education.list.queryFilter());
    onSave();
  };

  const labelStyle = { fontSize: "12px", color: "#797979", fontWeight: 500, marginBottom: "4px", display: "block" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label style={labelStyle}>Institution</label>
        <Input value={institution} onChange={(e) => setInstitution(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Degree</label>
          <Input value={degree} onChange={(e) => setDegree(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Field</label>
          <Input value={field} onChange={(e) => setField(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Year Start</label>
          <Input type="number" value={yearStart} onChange={(e) => setYearStart(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Year End</label>
          <Input type="number" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="outline" size="sm" disabled={createMut.isPending || updateMut.isPending}>
          {initial ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function EducationList() {
  const trpc = useTRPC();
  const { data: educations, isLoading, error } = useQuery(trpc.education.list.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.education.delete.mutationOptions());

  if (isLoading) return <Skeleton className="h-32 w-full rounded-[24px]" />;
  if (error) return <div className="text-sm text-red-600">Failed to load educations</div>;

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>Education</h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>+ Add Education</Button>
      </div>

      <div className="space-y-4">
        {adding && (
          <div className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
            <EduForm onSave={() => setAdding(false)} onCancel={() => setAdding(false)} />
          </div>
        )}
        {(!educations || educations.length === 0) && !adding && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>No education yet</EmptyTitle>
              <EmptyDescription>Add your educational background</EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
        {educations?.map((edu) =>
          editingId === edu.id ? (
            <div key={edu.id} className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <EduForm
                initial={{ ...edu, degree: edu.degree ?? null, field: edu.field ?? null, yearStart: edu.yearStart ?? null, yearEnd: edu.yearEnd ?? null }}
                onSave={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={edu.id} className="flex items-start justify-between rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#08304c", fontWeight: 500 }}>{edu.institution}</div>
                <div style={{ fontSize: "12px", color: "#797979", marginTop: "2px" }}>
                  {[edu.degree, edu.field].filter(Boolean).join(" · ")}
                  {(edu.yearStart || edu.yearEnd) && ` · ${edu.yearStart ?? ""}${edu.yearEnd ? ` — ${edu.yearEnd}` : ""}`}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="xs" onClick={() => setEditingId(edu.id)}>Edit</Button>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={async () => {
                    await deleteMut.mutateAsync({ id: edu.id }, { onError: (err) => toast.error(err.message) });
                    queryClient.invalidateQueries(trpc.education.list.queryFilter());
                  }}
                  disabled={deleteMut.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
