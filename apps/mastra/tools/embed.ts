import { env } from "@reurci/env/server";

const BASE_URL = env.SUMOPOD_BASE_URL.replace(/\/$/, "");
const API_KEY = env.SUMOPOD_API_KEY;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const res = await fetch(`${BASE_URL}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { data?: { embedding?: number[] }[] };
      const embedding = data.data?.[0]?.embedding;
      if (embedding) {
        if (embedding.length >= 384) return embedding.slice(0, 384);
        return [...embedding, ...new Array(384 - embedding.length).fill(0)];
      }
    }
  } catch {}

  return fallbackEmbedding(text);
}

function fallbackEmbedding(text: string): number[] {
  const chars = text.toLowerCase().replace(/\s+/g, " ").trim();
  const vec = new Array<number>(384).fill(0);
  for (let i = 0; i < chars.length; i++) {
    const idx = (chars.charCodeAt(i) * 37 + i * 7) % 384;
    vec[idx] = (vec[idx] ?? 0) + 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
