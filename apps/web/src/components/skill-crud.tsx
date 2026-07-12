import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { toast } from "sonner";
import { apiPost } from "@/utils/storage";

const Ink = "#08304c";
const Muted = "#797979";

const CATEGORY_PRESETS = [
  "Frontend", "Backend", "Databases", "API & System", "Tools",
  "AI-Native", "DevOps", "Languages", "Mobile", "Design", "Other",
];

export function SkillList() {
  const trpc = useTRPC();
  const { data: skills, isLoading, error } = useQuery(trpc.skill.list.queryOptions());
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.skill.create.mutationOptions());
  const updateMut = useMutation(trpc.skill.update.mutationOptions());
  const deleteMut = useMutation(trpc.skill.delete.mutationOptions());
  const [name, setName] = useState("");
  const [proficiency, setProficiency] = useState(3);
  const [category, setCategory] = useState("");
  const [customCat, setCustomCat] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; name: string; proficiency: number; category: string } | null>(null);
  const [categorizing, setCategorizing] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await updateMut.mutateAsync({
      id: editing.id,
      name: editing.name.trim(),
      proficiency: editing.proficiency,
      category: editing.category || undefined,
    }, { onError: (err) => toast.error(err.message) });
    queryClient.invalidateQueries(trpc.skill.list.queryFilter());
    setEditing(null);
  };

  const uncategorized = useMemo(() => skills?.filter(s => !s.category) ?? [], [skills]);

  const handleCategorize = async () => {
    if (uncategorized.length === 0) return;
    setCategorizing(true);
    try {
      const res = await apiPost<{ skills: { id: string; name: string; category: string }[] }>("/api/ai/tailor/categorize-skills", { skills: uncategorized.map(s => ({ id: s.id, name: s.name })) });
      for (const item of res.skills) {
        await updateMut.mutateAsync({ id: item.id, name: item.name, category: item.category }, { onError: () => {} });
      }
      queryClient.invalidateQueries(trpc.skill.list.queryFilter());
      toast.success(`Categorized ${res.skills.length} skills`);
    } catch {
      toast.error("Categorization failed");
    }
    setCategorizing(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createMut.mutateAsync({
      name: name.trim(),
      proficiency,
      category: customCat ? category.trim() || undefined : category || undefined,
    }, { onError: (err) => toast.error(err.message) });
    queryClient.invalidateQueries(trpc.skill.list.queryFilter());
    setName("");
    setProficiency(3);
    setCategory("");
    setCustomCat(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => skills && setSelected(new Set(skills.map((s) => s.id)));
  const deselectAll = () => setSelected(new Set());

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    toast.promise(
      (async () => {
        let ok = 0; let fail = 0;
        for (const id of selected) {
          try { await deleteMut.mutateAsync({ id }, { onError: () => {} }); ok++; }
          catch { fail++; }
        }
        queryClient.invalidateQueries(trpc.skill.list.queryFilter());
        setSelected(new Set()); setBulkMode(false);
        if (fail > 0) return `Deleted ${ok}, ${fail} failed`;
      })(),
      { loading: `Deleting ${selected.size} skills...`, success: (m) => m as string || `Deleted ${selected.size} skills`, error: "Delete failed" },
    );
  };

  const grouped = useMemo(() => {
    if (!skills) return [];
    const map = new Map<string, typeof skills>();
    for (const s of skills) {
      const cat = s.category || "Uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    const entries = [...map.entries()];
    const uncategorized = entries.find(([k]) => k === "Uncategorized");
    const categorized = entries.filter(([k]) => k !== "Uncategorized");
    categorized.sort(([a], [b]) => a.localeCompare(b));
    return [...categorized, ...(uncategorized ? [uncategorized] : [])];
  }, [skills]);

  const l = { fontSize: "12px", color: Muted, fontWeight: 500, marginBottom: "4px", display: "block" } as const;

  if (isLoading) return <Skeleton className="h-24 w-full rounded-[24px]" />;
  if (error) return <div className="text-sm text-red-600">Failed to load skills</div>;

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: Ink, fontWeight: 500 }}>Skills</h3>
        <div className="flex gap-2">
          {bulkMode ? (
            <>
              <Button variant="ghost" size="xs" onClick={selectAll}>Select All</Button>
              <Button variant="ghost" size="xs" onClick={deselectAll}>Deselect</Button>
              <Button variant="destructive" size="xs" onClick={deleteSelected} disabled={selected.size === 0}>Delete ({selected.size})</Button>
              <Button variant="ghost" size="xs" onClick={() => { setBulkMode(false); setSelected(new Set()); }}>Cancel</Button>
            </>
          ) : (
            <div className="flex gap-2">
              {uncategorized.length > 0 && (
                <Button variant="ghost" size="xs" onClick={handleCategorize} disabled={categorizing}>
                  {categorizing ? "..." : "Auto-Categorize"}
                </Button>
              )}
              <Button variant="ghost" size="xs" onClick={() => setBulkMode(true)} disabled={!skills || skills.length === 0}>Delete Mode</Button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 items-end mb-4 flex-wrap">
        <div style={{ flex: "1 1 160px" }}>
          <label style={l}>Skill</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. React" />
        </div>
        <div style={{ width: "68px", flexShrink: 0 }}>
          <label style={l}>Prof.</label>
          <Input type="number" min={1} max={5} value={proficiency} onChange={(e) => setProficiency(Number(e.target.value))} />
        </div>
        <div style={{ width: "140px", flexShrink: 0 }}>
          <label style={l}>Category</label>
          {!customCat ? (
            <select
              value={category}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__custom__") { setCustomCat(true); setCategory(""); }
                else setCategory(v);
              }}
              style={{
                width: "100%", height: "32px", borderRadius: "16px", border: "1px solid oklab(0 0 0 / 0.1)",
                padding: "0 12px", fontSize: "12px", color: Ink, background: "transparent", outline: "none",
              }}
            >
              <option value="">-</option>
              {CATEGORY_PRESETS.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">+ Custom...</option>
            </select>
          ) : (
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Custom category" />
          )}
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={createMut.isPending || !name.trim()} style={{ flexShrink: 0 }}>Add</Button>
      </form>

      {(!skills || skills.length === 0) && (
        <Empty>
          <EmptyContent>
            <EmptyTitle>No skills yet</EmptyTitle>
            <EmptyDescription>Add your technical skills grouped by category</EmptyDescription>
          </EmptyContent>
        </Empty>
      )}

      <div className="space-y-4">
        {grouped.map(([cat, items]) => (
          <div key={cat}>
            <div className="mb-2" style={{ fontSize: "13px", color: Ink, fontWeight: 600 }}>
              {cat}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((s) => (
                <div
                  key={s.id}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 cursor-pointer transition-colors ${bulkMode && selected.has(s.id) ? "ring-2 ring-[#084e72] ring-offset-1" : ""}`}
                  style={{
                    borderRadius: "9999px",
                    background: bulkMode && selected.has(s.id) ? Ink : "#e8f1ff",
                    color: bulkMode && selected.has(s.id) ? "#fff" : Ink,
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                  onClick={() => {
                    if (bulkMode) toggleSelect(s.id);
                    else setEditing({ id: s.id, name: s.name, proficiency: s.proficiency ?? 3, category: s.category ?? "" });
                  }}
                >
                  {bulkMode && <span style={{ fontSize: "10px" }}>{selected.has(s.id) ? "✓" : "○"}</span>}
                  <span>{s.name.replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  {s.proficiency && (
                    <span style={{ opacity: 0.6, fontWeight: 400 }}>({s.proficiency}/5)</span>
                  )}
                  {!bulkMode && (
                    <Button
                      variant="ghost"
                      size="xs"
                      style={{ minWidth: 0, padding: "0 2px", marginLeft: "2px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMut.mutateAsync({ id: s.id }, { onError: (err) => toast.error(err.message) });
                        queryClient.invalidateQueries(trpc.skill.list.queryFilter());
                      }}
                      disabled={deleteMut.isPending}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "oklab(0 0 0 / 0.3)" }} onClick={() => setEditing(null)}>
          <form
            onSubmit={handleUpdate}
            className="rounded-[24px] bg-white p-6 mx-4 max-w-[360px] w-full"
            style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.06), 0 24px 24px -8px rgba(0,0,0,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-4" style={{ fontSize: "15px", color: Ink, fontWeight: 600 }}>Edit Skill</h4>
            <div className="space-y-3">
              <div>
                <label className="block mb-1" style={{ fontSize: "12px", color: Muted, fontWeight: 500 }}>Name</label>
                <Input value={editing.name} onChange={(e) => setEditing((p) => p ? { ...p, name: e.target.value } : null)} />
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "12px", color: Muted, fontWeight: 500 }}>Proficiency (1-5)</label>
                <Input type="number" min={1} max={5} value={editing.proficiency} onChange={(e) => setEditing((p) => p ? { ...p, proficiency: Number(e.target.value) } : null)} />
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "12px", color: Muted, fontWeight: 500 }}>Category</label>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing((p) => p ? { ...p, category: e.target.value } : null)}
                  style={{ width: "100%", height: "34px", borderRadius: "16px", border: "1px solid oklab(0 0 0 / 0.1)", padding: "0 12px", fontSize: "13px", color: Ink, background: "transparent", outline: "none" }}
                >
                  <option value="">Uncategorized</option>
                  {CATEGORY_PRESETS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="rainbow" size="sm" disabled={updateMut.isPending}>Save</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
