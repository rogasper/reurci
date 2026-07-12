import { useState, useEffect, useRef } from "react";
import { Button } from "@reurci/ui/components/button";
import { Input } from "@reurci/ui/components/input";
import { toast } from "sonner";

const STORAGE_KEY = "reurci.pii.v1";

export interface PiiData {
  name: string;
  title?: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  github?: string;
  website?: string;
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

export function PiiSection({ userId, onUpdate, generateTitle }: { userId: string; onUpdate?: (pii: PiiData) => void; generateTitle?: () => Promise<string | null> }) {
  const [pii, setPii] = useState<PiiData>({ name: "", title: "", email: "", phone: "", address: "", linkedin: "", github: "", website: "" });
  const [loaded, setLoaded] = useState(false);
  const [titleGen, setTitleGen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      decryptPii(stored, userId).then((data) => {
        if (data) {
          setPii(data);
          onUpdate?.(data);
        }
        setLoaded(true);
      });
    } else {
      setLoaded(true);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [userId]);

  const handleSave = async () => {
    const encrypted = await encryptPii(pii, userId);
    localStorage.setItem(STORAGE_KEY, encrypted);
    onUpdate?.(pii);
    toast.success("Profile info saved locally");
  };

  const updateField = (key: keyof PiiData, value: string) => {
    setPii((p) => {
      const next = { ...p, [key]: value };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onUpdate?.(next), 400);
      return next;
    });
  };

  const handleGenerateTitle = async () => {
    if (!generateTitle) return;
    setTitleGen(true);
    try {
      const title = await generateTitle();
      if (title) {
        setPii((p) => {
          const next = { ...p, title };
          onUpdate?.(next);
          return next;
        });
        toast.success("Title generated");
      }
    } catch { toast.error("Title generation failed"); }
    setTitleGen(false);
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
            <Input value={pii.name} onChange={(e) => updateField("name", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Title {generateTitle && <Button variant="ghost" size="xs" onClick={handleGenerateTitle} disabled={titleGen} style={{ marginLeft: "8px", fontSize: "10px" }}>{titleGen ? "..." : "Generate from Exp"}</Button>}</label>
            <Input value={pii.title ?? ""} onChange={(e) => updateField("title", e.target.value)} placeholder="Fullstack Engineer" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Email</label>
            <Input type="email" value={pii.email} onChange={(e) => updateField("email", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <Input value={pii.phone} onChange={(e) => updateField("phone", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>LinkedIn</label>
            <Input value={pii.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
          </div>
          <div>
            <label style={labelStyle}>GitHub</label>
            <Input value={pii.github ?? ""} onChange={(e) => updateField("github", e.target.value)} placeholder="github.com/..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Website</label>
            <Input value={pii.website ?? ""} onChange={(e) => updateField("website", e.target.value)} placeholder="yourdomain.dev" />
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <Input value={pii.address} onChange={(e) => updateField("address", e.target.value)} />
          </div>
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
