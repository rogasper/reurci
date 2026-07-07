const KEY = "reurci:tailor-state";

export function ls<T = any>(): T | null {
  try { const s = sessionStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}

export function ss(key: string, state: any) {
  try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {}
}

export function sc() { sessionStorage.removeItem(KEY); }

import { env } from "@reurci/env/web";

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(`${env.VITE_SERVER_URL}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(t.slice(0, 200)); }
  return res.json();
}
