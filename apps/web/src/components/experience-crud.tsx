import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { toast } from "sonner";

function ExpForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: {
    id: string;
    company: string;
    role: string;
    periodStart: string;
    periodEnd: string | null;
    description: string | null;
    achievements: string[];
  };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [periodStart, setPeriodStart] = useState(initial?.periodStart ?? "");
  const [periodEnd, setPeriodEnd] = useState(initial?.periodEnd ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [achievement, setAchievement] = useState("");
  const [achievements, setAchievements] = useState<string[]>(initial?.achievements ?? []);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.experience.create.mutationOptions());
  const updateMut = useMutation(trpc.experience.update.mutationOptions());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      company,
      role,
      periodStart,
      periodEnd: periodEnd || undefined,
      description: description || undefined,
      achievements: achievements.length > 0 ? achievements : undefined,
    };
    if (initial) {
      await updateMut.mutateAsync({ id: initial.id, ...data }, { onError: (err) => toast.error(err.message) });
    } else {
      await createMut.mutateAsync(data, { onError: (err) => toast.error(err.message) });
    }
    queryClient.invalidateQueries(trpc.experience.list.queryFilter());
    onSave();
  };

  const addAchievement = () => {
    if (achievement.trim()) {
      setAchievements((prev) => [...prev, achievement.trim()]);
      setAchievement("");
    }
  };

  const labelStyle = { fontSize: "12px", color: "#797979", fontWeight: 500, marginBottom: "4px", display: "block" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Company</label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Role</label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Period Start</label>
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Period End</label>
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-[16px] border px-3 py-2 text-[12px] text-[#08304c] outline-none bg-transparent transition-colors focus:border-[#084e72]/30"
          style={{ borderColor: "oklab(0 0 0 / 0.08)" }}
        />
      </div>
      <div>
        <label style={labelStyle}>Achievements</label>
        {achievements.length > 0 && (
          <ul className="mb-2 space-y-1">
            {achievements.map((a, i) => (
              <li key={i} className="flex items-center justify-between text-xs rounded-[12px] px-3 py-1.5 bg-[#e8f1ff] text-[#08304c]">
                <span>{a}</span>
                <Button variant="ghost" size="xs" onClick={() => setAchievements((prev) => prev.filter((_, j) => j !== i))}>
                  ×
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAchievement(); } }}
            placeholder="Add achievement..."
          />
          <Button type="button" variant="ghost" size="sm" onClick={addAchievement}>Add</Button>
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

export function ExperienceList() {
  const trpc = useTRPC();
  const { data: experiences, isLoading, error } = useQuery(trpc.experience.list.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.experience.delete.mutationOptions());

  if (isLoading) return <Skeleton className="h-32 w-full rounded-[24px]" />;
  if (error) return <div className="text-sm text-red-600">Failed to load experiences</div>;

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>Experiences</h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>+ Add Experience</Button>
      </div>

      <div className="space-y-4">
        {adding && (
          <div className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
            <ExpForm onSave={() => setAdding(false)} onCancel={() => setAdding(false)} />
          </div>
        )}
        {(!experiences || experiences.length === 0) && !adding && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>No experiences yet</EmptyTitle>
              <EmptyDescription>Add your work history to get started</EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
        {experiences?.map((exp) =>
          editingId === exp.id ? (
            <div key={exp.id} className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <ExpForm
                initial={{ ...exp, periodEnd: exp.periodEnd ?? null, description: exp.description ?? null, achievements: exp.achievements ?? [] }}
                onSave={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={exp.id} className="flex items-start justify-between rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#08304c", fontWeight: 500 }}>
                  {exp.role} at {exp.company}
                </div>
                <div style={{ fontSize: "12px", color: "#797979", marginTop: "2px" }}>
                  {exp.periodStart}{exp.periodEnd ? ` — ${exp.periodEnd}` : " — Present"}
                </div>
                {exp.description && <p className="mt-1" style={{ fontSize: "12px", color: "#2c2c2c" }}>{exp.description}</p>}
                {(exp.achievements ?? []).length > 0 && (
                  <ul className="mt-1 list-disc list-inside" style={{ fontSize: "12px", color: "#797979" }}>
                    {exp.achievements!.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="xs" onClick={() => setEditingId(exp.id)}>Edit</Button>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={async () => {
                    await deleteMut.mutateAsync({ id: exp.id }, { onError: (err) => toast.error(err.message) });
                    queryClient.invalidateQueries(trpc.experience.list.queryFilter());
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
