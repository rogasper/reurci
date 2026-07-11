import { test, expect } from "bun:test";
import { lintRephrase, lintAchievements } from "../apps/mastra/lib/anti-fabrikasi";

test("returns high overlap when text is rephrased with same keywords", () => {
  const result = lintRephrase(
    "Led agile team to deliver 15 features in Q3, reducing cycle time by 40%",
    "Managed an agile development team that shipped 15 features in Q3, cutting cycle time by 40%",
  );
  expect(result.score).toBeGreaterThanOrEqual(50);
  expect(result.flagged).toBe(false);
});

test("flags when key nouns are missing from rephrased", () => {
  const result = lintRephrase(
    "Developed Kubernetes infrastructure for 50 microservices at scale",
    "Worked on some infrastructure stuff",
  );
  expect(result.score).toBeLessThan(50);
  expect(result.flagged).toBe(true);
});

test("handles empty original gracefully", () => {
  const result = lintRephrase("", "");
  expect(result.score).toBe(100);
  expect(result.flagged).toBe(false);
});

test("bulk lintAchievements returns flagged count", () => {
  const result = lintAchievements(
    ["Led team of 10 engineers delivering React dashboard"],
    ["Oversaw a group building a web interface"],
  );
  expect(typeof result.flagged).toBe("number");
  expect(result.results.length).toBe(1);
});

test("no overlap between unrelated words returns score 0", () => {
  const result = lintRephrase("engineer", "developer");
  expect(result.score).toBe(0);
});
