import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { toast } from "sonner";

function LangForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { id: string; name: string; proficiency: string | null };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [proficiency, setProficiency] = useState(initial?.proficiency ?? "");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.language.create.mutationOptions());
  const updateMut = useMutation(trpc.language.update.mutationOptions());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, proficiency: proficiency || undefined };
    if (initial) {
      await updateMut.mutateAsync({ id: initial.id, ...data }, { onError: (err) => toast.error(err.message) });
    } else {
      await createMut.mutateAsync(data, { onError: (err) => toast.error(err.message) });
    }
    queryClient.invalidateQueries(trpc.language.list.queryFilter());
    onSave();
  };

  const labelStyle = { fontSize: "12px", color: "#797979", fontWeight: 500, marginBottom: "4px", display: "block" } as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label style={labelStyle}>Language</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="English" />
      </div>
      <div>
        <label style={labelStyle}>Proficiency</label>
        <Input value={proficiency} onChange={(e) => setProficiency(e.target.value)} placeholder="Native, C2, Fluent, B1, Elementary..." />
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

export function LanguageList() {
  const trpc = useTRPC();
  const { data: languages, isLoading, error } = useQuery(trpc.language.list.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.language.delete.mutationOptions());

  if (isLoading) return <Skeleton className="h-32 w-full rounded-[24px]" />;
  if (error) return <div className="text-sm text-red-600">Failed to load languages</div>;

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>Languages</h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>+ Add Language</Button>
      </div>

      <div className="space-y-4">
        {adding && (
          <div className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
            <LangForm onSave={() => setAdding(false)} onCancel={() => setAdding(false)} />
          </div>
        )}
        {(!languages || languages.length === 0) && !adding && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>No languages yet</EmptyTitle>
              <EmptyDescription>Add languages you speak</EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
        {languages?.map((lang) =>
          editingId === lang.id ? (
            <div key={lang.id} className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <LangForm
                initial={{ ...lang, proficiency: lang.proficiency ?? null }}
                onSave={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={lang.id} className="flex items-start justify-between rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#08304c", fontWeight: 500 }}>{lang.name}</div>
                {lang.proficiency && <div style={{ fontSize: "12px", color: "#797979", marginTop: "2px" }}>{lang.proficiency}</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="xs" onClick={() => setEditingId(lang.id)}>Edit</Button>
                <Button variant="destructive" size="xs" onClick={async () => {
                  await deleteMut.mutateAsync({ id: lang.id }, { onError: (err) => toast.error(err.message) });
                  queryClient.invalidateQueries(trpc.language.list.queryFilter());
                }} disabled={deleteMut.isPending}>Delete</Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
