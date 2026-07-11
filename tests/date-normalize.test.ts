import { test, expect } from "bun:test";

function normalizeDate(d: string | undefined | null): string | undefined {
  if (!d) return undefined;
  const s = String(d);
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  return s;
}

test('converts "2023-09" to "2023-09-01"', () => {
  expect(normalizeDate("2023-09")).toBe("2023-09-01");
});

test('converts "2023" to "2023-01-01"', () => {
  expect(normalizeDate("2023")).toBe("2023-01-01");
});

test('keeps full date intact', () => {
  expect(normalizeDate("2023-09-15")).toBe("2023-09-15");
});

test("returns undefined for null", () => {
  expect(normalizeDate(null)).toBeUndefined();
});

test("returns undefined for undefined", () => {
  expect(normalizeDate(undefined)).toBeUndefined();
});
