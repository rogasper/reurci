import { test, expect } from "bun:test";

// Inline the stripReasoningBlocks and extractJson for testing
const THINK_PATTERNS = [
  /<think>[\s\S]*?<\/think>/gi,
  /<thinking>[\s\S]*?<\/thinking>/gi,
];

function stripReasoningBlocks(text: string): string {
  let result = text;
  for (const pattern of THINK_PATTERNS) result = result.replace(pattern, "");
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

test("stripReasoningBlocks removes <think> tags", () => {
  const result = stripReasoningBlocks("Hello <think>this is reasoning</think> world");
  expect(result).toBe("Hello  world");
});

test("stripReasoningBlocks removes multiple think blocks", () => {
  const result = stripReasoningBlocks("A<think>one</think>B<think>two</think>C");
  expect(result).toBe("ABC");
});

test("stripReasoningBlocks removes <thinking> tags too", () => {
  const result = stripReasoningBlocks("out <thinking>hidden</thinking> end");
  expect(result).toBe("out  end");
});

test("extractJson parses bare JSON directly", () => {
  const result = extractJson('{"a":1}');
  expect(JSON.parse(result)).toEqual({ a: 1 });
});

test("extractJson extracts from fenced code block", () => {
  const result = extractJson("Some text\n```json\n{\"a\":1}\n```\nmore");
  expect(JSON.parse(result)).toEqual({ a: 1 });
});

test("extractJson extracts from un-marked code block", () => {
  const result = extractJson("text\n```\n{\"b\":2}\n```\nend");
  expect(JSON.parse(result)).toEqual({ b: 2 });
});

test("extractJson extracts from bare braces after reasoning text", () => {
  const result = extractJson("Here is the result: {\"key\":\"val\"}. That's it.");
  expect(JSON.parse(result)).toEqual({ key: "val" });
});

test("extractJson handles text with no JSON", () => {
  const result = extractJson("No JSON here at all");
  expect(result).toBe("No JSON here at all");
});
