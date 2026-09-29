import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { snapshotPayload } from "../api/snapshot.ts";

test("snapshot payload keeps the existing response shape", () => {
  const value = snapshotPayload("https://example.com/");
  assert.deepEqual(Object.keys(value).sort(), ["breakpoints", "discoveredPages", "success", "url"]);
  assert.equal(value.success, true);
  assert.equal(value.url, "https://example.com/");
  assert.ok(Array.isArray(value.discoveredPages));
  assert.ok(Array.isArray(value.breakpoints));
});

test("agent preserves the parent message contract", async () => {
  const agent = await readFile(new URL("../public/agent.js", import.meta.url), "utf8");
  for (const token of ["canvas-feedback-agent", "ready", "scroll", "click", "scrollTo", "setMode"]) {
    assert.match(agent, new RegExp(token));
  }
});
