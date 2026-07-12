import { z } from "zod";
import { env } from "@reurci/env/server";

const BASE_URL = env.SUMOPOD_BASE_URL.replace(/\/$/, "");
const API_KEY = env.SUMOPOD_API_KEY;
const MODEL = env.SUMOPOD_DEFAULT_MODEL;

const THINK_PATTERNS = [
  /<think>[\s\S]*?<\/think>/gi,
  /<thinking>[\s\S]*?<\/thinking>/gi,
];

const S = (v: unknown) => (typeof v === "string" ? v.slice(0, 300) : JSON.stringify(v).slice(0, 300));

function stripReasoningBlocks(text: string): string {
  let result = text;
  for (const pattern of THINK_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function extractJson(text: string): string {
  const cleaned = stripReasoningBlocks(text);
  try { JSON.parse(cleaned); return cleaned; } catch {}

  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const candidate = fenced[1].trim();
    try { JSON.parse(candidate); return candidate; } catch {}
  }

  const objStart = cleaned.indexOf("{");
  if (objStart >= 0) {
    const slice = cleaned.slice(objStart);
    let depth = 0, end = -1;
    for (let i = 0; i < slice.length; i++) {
      if (slice[i] === "{") depth++;
      else if (slice[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end > 0) {
      const candidate = slice.slice(0, end);
      try { JSON.parse(candidate); return candidate; } catch {}
    }
  }
  return cleaned;
}

async function chatCompletion(
  system: string,
  prompt: string,
  temperature: number,
  signal?: AbortSignal,
): Promise<string> {
  const hasJson = /json/i.test(system) || /json/i.test(prompt);
  const userPrompt = hasJson ? prompt : `${prompt}\n\nReturn JSON.`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature,
      stream: true,
      response_format: { type: "json_object" },
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const chunk = JSON.parse(data);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (typeof delta === "string") fullText += delta;
      } catch {}
    }
  }

  return fullText;
}

export async function callAndParse<T>(
  schema: z.ZodType<T>,
  system: string,
  prompt: string,
  _maxTokens: number,
  opts?: { temperature?: number; retries?: number },
): Promise<T> {
  const temperature = opts?.temperature ?? 0.1;
  const maxRetries = opts?.retries ?? 1;
  const label = system.slice(0, 60).replace(/\n.*/s, "...").trim();

  console.log(`[ai-utils] → call  label="${label}" promptLen=${prompt.length} retries=${maxRetries}`);

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const usedPrompt = prompt;
      const usedTemp = attempt > 1 ? Math.min(temperature + 0.2, 0.8) : temperature;

      console.log(`[ai-utils]   → chatCompletion attempt=${attempt} promptLen=${usedPrompt.length} temp=${usedTemp}`);

      const text = await chatCompletion(system, usedPrompt, usedTemp);

      console.log(`[ai-utils]   ← raw  len=${text.length} preview="${S(text)}"`);

      if (!text) {
        console.warn(`[ai-utils]   ✗ empty`);
        if (attempt <= maxRetries) continue;
        throw new Error("Empty response from AI");
      }

      const json = extractJson(text);
      console.log(`[ai-utils]   › json len=${json.length} preview="${json.slice(0, 300)}"`);

      if (!json) {
        console.warn(`[ai-utils]   ✗ no json`);
        if (attempt <= maxRetries) continue;
        throw new Error("No JSON found");
      }

      const parsed = schema.parse(JSON.parse(json));
      const shape = isObject(parsed)
        ? Object.keys(parsed).map(k =>
            `${k}:${Array.isArray((parsed as any)[k]) ? (parsed as any)[k].length : typeof (parsed as any)[k]}`,
          ).join(", ")
        : typeof parsed;
      console.log(`[ai-utils] ✓ done  keys=${shape}`);
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.warn(`[ai-utils]   ✗ error msg="${msg.slice(0, 300)}"`);
      if (attempt <= maxRetries) {
        console.log(`[ai-utils]   → retry ${attempt}→${attempt + 1}`);
        continue;
      }
      console.error(`[ai-utils]   ✗ final fail`);
      throw err;
    }
  }

  throw new Error("callAndParse failed after all retries");
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
