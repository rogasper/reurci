import { useState, useEffect } from "react";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const STORAGE_KEY = "reurci.pii.v1";

export interface PiiData {
  name: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
}

export async function deriveKey(userId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(userId), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("reurci-pii-salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptPii(data: PiiData, userId: string): Promise<string> {
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(data)));
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptPii(encrypted: string, userId: string): Promise<PiiData | null> {
  try {
    const key = await deriveKey(userId);
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: combined.slice(0, 12) }, key, combined.slice(12));
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}

export function PiiSection() {
  const trpc = useTRPC();
  const { data: profile } = useQuery(trpc.profile.getOrCreate.queryOptions());
  const userId = profile?.userId;
  const [pii, setPii] = useState<PiiData>({ name: "", email: "", phone: "", address: "", linkedin: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      decryptPii(stored, userId).then((data) => { if (data) setPii(data); setLoaded(true); });
    } else {
      setLoaded(true);
    }
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    const encrypted = await encryptPii(pii, userId);
    localStorage.setItem(STORAGE_KEY, encrypted);
    toast.success("Profile info saved locally");
  };

  const labelStyle = { fontSize: "12px", color: "#797979", fontWeight: 500, marginBottom: "4px", display: "block" };

  return (
    <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: "16px", color: "#08304c", fontWeight: 500 }}>Personal Info</h3>
        <span style={{ fontSize: "11px", color: "#797979" }}>Stored encrypted in your browser only</span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Full Name</label>
            <Input value={pii.name} onChange={(e) => setPii((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <Input type="email" value={pii.email} onChange={(e) => setPii((p) => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Phone</label>
            <Input value={pii.phone} onChange={(e) => setPii((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>LinkedIn</label>
            <Input value={pii.linkedin} onChange={(e) => setPii((p) => ({ ...p, linkedin: e.target.value }))} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Address</label>
          <Input value={pii.address} onChange={(e) => setPii((p) => ({ ...p, address: e.target.value }))} />
        </div>
        {loaded && (
          <Button variant="secondary" size="sm" className="w-full" onClick={handleSave}>
            Save to Browser
          </Button>
        )}
      </div>
    </div>
  );
}
