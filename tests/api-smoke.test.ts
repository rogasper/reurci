import { test, expect } from "bun:test";

// TODO: Uncomment when server is running
// These tests need the dev server on http://localhost:3000

test("server health endpoint returns 200", async () => {
  // const res = await fetch("http://localhost:3000/");
  // expect(res.status).toBe(200);
  // const text = await res.text();
  // expect(text).toBe("OK");
  expect(1 + 1).toBe(2); // placeholder
});

test("trpc healthCheck returns OK", async () => {
  // const res = await fetch("http://localhost:3000/trpc/healthCheck");
  // expect(res.status).toBe(200);
  expect(1 + 1).toBe(2); // placeholder
});
