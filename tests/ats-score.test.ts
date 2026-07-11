import { test, expect } from "bun:test";
import { computeATSScore } from "../apps/web/src/components/ats-score";

test("returns 70+ when all JD skills match selected skills", () => {
  const score = computeATSScore({
    jdHardSkills: ["react", "typescript", "node"],
    selectedExperiences: [
      {
        description: "Built React apps with Node.js backend, used TypeScript daily for 3 years",
        achievements: ["Led 3 React projects", "Contributed to TypeScript library", "Designed Node.js microservices"],
      },
    ],
    selectedSkills: [{ name: "React" }, { name: "Node.js" }, { name: "TypeScript" }],
  });
  expect(score).toBeGreaterThanOrEqual(70);
});

test("returns low score when no skills match", () => {
  const score = computeATSScore({
    jdHardSkills: ["react", "node", "python"],
    selectedExperiences: [
      { description: "Managed Excel spreadsheets", achievements: [] },
    ],
    selectedSkills: [{ name: "Excel" }],
  });
  expect(score).toBeLessThan(50);
});

test("returns 0 when jdHardSkills is empty", () => {
  const score = computeATSScore({
    jdHardSkills: [],
    selectedExperiences: [{ description: "Built stuff", achievements: [] }],
    selectedSkills: [{ name: "React" }],
  });
  expect(score).toBe(0);
});

test("keyword match adds to score even without direct skill overlap", () => {
  const score = computeATSScore({
    jdHardSkills: ["react", "typescript"],
    selectedExperiences: [
      { description: "Developed React components and TypeScript utilities", achievements: ["Built with React"] },
    ],
    selectedSkills: [{ name: "React" }],
  });
  expect(score).toBeGreaterThan(60);
});
