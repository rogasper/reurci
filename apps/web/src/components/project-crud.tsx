import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { toast } from "sonner";

const Ink = "#08304c";
const Muted = "#797979";

function ProjectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { id: string; name: string; description: string | null; url: string | null; techStack: string[]; year: number | null };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [techStack, setTechStack] = useState((initial?.techStack ?? []).join(", "));
  const [year, setYear] = useState(initial?.year?.toString() ?? "");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.project.create.mutationOptions());
  const updateMut = useMutation(trpc.project.update.mutationOptions());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      description: description || undefined,
      url: url || undefined,
      techStack: techStack ? techStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      year: year ? Number(year) : undefined,
    };
    if (initial) {
      await updateMut.mutateAsync({ id: initial.id, ...data }, { onError: (err) => toast.error(err.message) });
    } else {
      await createMut.mutateAsync(data, { onError: (err) => toast.error(err.message) });
    }
    queryClient.invalidateQueries(trpc.project.list.queryFilter());
    onSave();
  };

  const l = { fontSize: "12px", color: Muted, fontWeight: 500, marginBottom: "4px", display: "block" } as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={l}>Project Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="My Open Source Library" />
        </div>
        <div>
          <label style={l}>Year</label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
        </div>
      </div>
      <div>
        <label style={l}>URL</label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/..." />
      </div>
      <div>
        <label style={l}>Tech Stack (comma separated)</label>
        <Input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, TypeScript, Node.js" />
      </div>
      <div>
        <label style={l}>Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the project..." />
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

export function ProjectList() {
  const trpc = useTRPC();
  const { data: projects, isLoading, error } = useQuery(trpc.project.list.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.project.delete.mutationOptions());

  if (isLoading) return <Skeleton className="h-32 w-full rounded-[24px]" />;
  if (error) return <div className="text-sm text-red-600">Failed to load projects</div>;

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: Ink, fontWeight: 500 }}>Projects</h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>+ Add Project</Button>
      </div>

      <div className="space-y-4">
        {adding && (
          <div className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
            <ProjectForm onSave={() => setAdding(false)} onCancel={() => setAdding(false)} />
          </div>
        )}
        {(!projects || projects.length === 0) && !adding && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>No projects yet</EmptyTitle>
              <EmptyDescription>Add open source, freelance, or side projects</EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
        {projects?.map((proj) =>
          editingId === proj.id ? (
            <div key={proj.id} className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <ProjectForm
                initial={{ ...proj, description: proj.description ?? null, url: proj.url ?? null, techStack: (proj.techStack as string[]) ?? [], year: proj.year ?? null }}
                onSave={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={proj.id} className="flex items-start justify-between rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <div>
                <div style={{ fontSize: "14px", color: Ink, fontWeight: 500 }}>{proj.name}</div>
                {proj.url && <div style={{ fontSize: "12px", color: "#084e72", marginTop: "2px" }}>{proj.url}</div>}
                {proj.description && <div style={{ fontSize: "12px", color: Muted, marginTop: "2px", maxWidth: "400px" }}>{proj.description}</div>}
                {(proj.techStack as string[])?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(proj.techStack as string[]).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-[9999px] text-[10px] font-semibold" style={{ background: "#e8f1ff", color: Ink }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: "11px", color: Muted, marginTop: "2px" }}>{[proj.year].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="xs" onClick={() => setEditingId(proj.id)}>Edit</Button>
                <Button variant="destructive" size="xs" onClick={async () => {
                  await deleteMut.mutateAsync({ id: proj.id }, { onError: (err) => toast.error(err.message) });
                  queryClient.invalidateQueries(trpc.project.list.queryFilter());
                }} disabled={deleteMut.isPending}>Delete</Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
