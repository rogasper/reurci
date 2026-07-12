import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@reurci/ui/components/empty";
import { toast } from "sonner";

function CertForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { id: string; name: string; issuer: string | null; year: number | null; url: string | null };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [issuer, setIssuer] = useState(initial?.issuer ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createMut = useMutation(trpc.certificate.create.mutationOptions());
  const updateMut = useMutation(trpc.certificate.update.mutationOptions());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, issuer: issuer || undefined, year: year ? Number(year) : undefined, url: url || undefined };
    if (initial) {
      await updateMut.mutateAsync({ id: initial.id, ...data }, { onError: (err) => toast.error(err.message) });
    } else {
      await createMut.mutateAsync(data, { onError: (err) => toast.error(err.message) });
    }
    queryClient.invalidateQueries(trpc.certificate.list.queryFilter());
    onSave();
  };

  const labelStyle = { fontSize: "12px", color: "#797979", fontWeight: 500, marginBottom: "4px", display: "block" } as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label style={labelStyle}>Certificate Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="AWS Solutions Architect" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Issuer</label>
          <Input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="Amazon Web Services" />
        </div>
        <div>
          <label style={labelStyle}>Year</label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2023" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>URL (optional)</label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
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

export function CertificateList() {
  const trpc = useTRPC();
  const { data: certificates, isLoading, error } = useQuery(trpc.certificate.list.queryOptions());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const queryClient = useQueryClient();
  const deleteMut = useMutation(trpc.certificate.delete.mutationOptions());

  if (isLoading) return <Skeleton className="h-32 w-full rounded-[24px]" />;
  if (error) return <div className="text-sm text-red-600">Failed to load certificates</div>;

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>Certifications</h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>+ Add Certificate</Button>
      </div>

      <div className="space-y-4">
        {adding && (
          <div className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
            <CertForm onSave={() => setAdding(false)} onCancel={() => setAdding(false)} />
          </div>
        )}
        {(!certificates || certificates.length === 0) && !adding && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>No certifications yet</EmptyTitle>
              <EmptyDescription>Add professional certifications and licenses</EmptyDescription>
            </EmptyContent>
          </Empty>
        )}
        {certificates?.map((cert) =>
          editingId === cert.id ? (
            <div key={cert.id} className="rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <CertForm
                initial={{ ...cert, issuer: cert.issuer ?? null, year: cert.year ?? null, url: cert.url ?? null }}
                onSave={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={cert.id} className="flex items-start justify-between rounded-[16px] border p-4" style={{ borderColor: "oklab(0 0 0 / 0.04)" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#08304c", fontWeight: 500 }}>{cert.name}</div>
                <div style={{ fontSize: "12px", color: "#797979", marginTop: "2px" }}>
                  {[cert.issuer, cert.year ? String(cert.year) : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="xs" onClick={() => setEditingId(cert.id)}>Edit</Button>
                <Button variant="destructive" size="xs" onClick={async () => {
                  await deleteMut.mutateAsync({ id: cert.id }, { onError: (err) => toast.error(err.message) });
                  queryClient.invalidateQueries(trpc.certificate.list.queryFilter());
                }} disabled={deleteMut.isPending}>Delete</Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
