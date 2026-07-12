import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { toast } from "sonner";

function AchForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { id: string; title: string; description: string | null; year: number | null };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.achievement.create.mutationOptions());
  const updateMut = useMutation(trpc.achievement.update.mutationOptions());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title, description: description || undefined, year: year ? Number(year) : undefined };
    if (initial) {
      await updateMut.mutateAsync({ id: initial.id, ...data }, { onError: (err) => toast.error(err.message) });
    } else {
      await createMut.mutateAsync(data, { onError: (err) => toast.error(err.message) });
    }
    queryClient.invalidateQueries(trpc.achievement.list.queryFilter());
    onSave();
  };

  const labelStyle = { fontSize: "12px", color: "#797979", fontWeight: 500, marginBottom: "4px", display: "block" } as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label style={labelStyle}>Award / Achievement</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Employee of the Year 2023" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Year</label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2023" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description (optional)</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Awarded for leading the migration project..." />
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

export function AchievementList() {
  const trpc = useTRPC();
  const { data: achievements, isLoading, error } = useQuery(trpc.achievement.list.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.achievement.delete.mutationOptions());

  if (isLoading) return <Skeleton className="h-32 w-full rounded-[24px]" />;
  if (error) return <div className="text-sm text-red-600">Failed to load achievements</div>;

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>Achievements & Awards</h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>+ Add Achievement</Button>
      </div>

      <div className="space-y-4">
        {adding && (
          <div className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
            <AchForm onSave={() => setAdding(false)} onCancel={() => setAdding(false)} />
          </div>
        )}
        {(!achievements || achievements.length === 0) && !adding && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>No achievements yet</EmptyTitle>
              <EmptyDescription>Add awards, honors, and notable achievements</EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
        {achievements?.map((ach) =>
          editingId === ach.id ? (
            <div key={ach.id} className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <AchForm
                initial={{ ...ach, description: ach.description ?? null, year: ach.year ?? null }}
                onSave={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={ach.id} className="flex items-start justify-between rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#08304c", fontWeight: 500 }}>{ach.title}</div>
                <div style={{ fontSize: "12px", color: "#797979", marginTop: "2px" }}>
                  {[ach.year ? String(ach.year) : null, ach.description].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="xs" onClick={() => setEditingId(ach.id)}>Edit</Button>
                <Button variant="destructive" size="xs" onClick={async () => {
                  await deleteMut.mutateAsync({ id: ach.id }, { onError: (err) => toast.error(err.message) });
                  queryClient.invalidateQueries(trpc.achievement.list.queryFilter());
                }} disabled={deleteMut.isPending}>Delete</Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
