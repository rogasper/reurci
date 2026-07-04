import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { toast } from "sonner";

export function SkillList() {
  const trpc = useTRPC();
  const { data: skills, isLoading, error } = useQuery(trpc.skill.list.queryOptions());
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.skill.create.mutationOptions());
  const deleteMut = useMutation(trpc.skill.delete.mutationOptions());
  const [name, setName] = useState("");
  const [proficiency, setProficiency] = useState(3);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createMut.mutateAsync({ name: name.trim(), proficiency }, { onError: (err) => toast.error(err.message) });
    queryClient.invalidateQueries(trpc.skill.list.queryFilter());
    setName("");
    setProficiency(3);
  };

  const labelStyle = { fontSize: "12px", color: "#797979", fontWeight: 500, marginBottom: "4px", display: "block" };

  if (isLoading) return <Skeleton className="h-24 w-full rounded-[24px]" />;
  if (error) return <div className="text-sm text-red-600">Failed to load skills</div>;

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <h3 className="mb-4" style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>Skills</h3>

      <form onSubmit={handleAdd} className="flex gap-2 items-end mb-4">
        <div className="flex-1">
          <label style={labelStyle}>Skill</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. React" />
        </div>
        <div className="w-20">
          <label style={labelStyle}>Prof.</label>
          <Input type="number" min={1} max={5} value={proficiency} onChange={(e) => setProficiency(Number(e.target.value))} />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={createMut.isPending || !name.trim()}>Add</Button>
      </form>

      {(!skills || skills.length === 0) && (
        <Empty>
          <EmptyContent>
            <EmptyTitle>No skills yet</EmptyTitle>
            <EmptyDescription>Add your technical skills</EmptyDescription>
          </EmptyContent>
        </Empty>
      )}
      <div className="flex flex-wrap gap-2">
        {skills?.map((s) => (
          <div
            key={s.id}
            className="inline-flex items-center gap-1.5 px-4 py-2"
            style={{
              borderRadius: "9999px",
              background: "#e8f1ff",
              color: "#08304c",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            <span>{s.name}</span>
            {s.proficiency && (
              <span style={{ opacity: 0.6, letterSpacing: 0, textTransform: "none" }}>({s.proficiency}/5)</span>
            )}
            <Button
              variant="ghost"
              size="xs"
              style={{ minWidth: 0, padding: "0 2px" }}
              onClick={async () => {
                await deleteMut.mutateAsync({ id: s.id }, { onError: (err) => toast.error(err.message) });
                queryClient.invalidateQueries(trpc.skill.list.queryFilter());
              }}
              disabled={deleteMut.isPending}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
