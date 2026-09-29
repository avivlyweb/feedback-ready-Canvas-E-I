import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { snapshotPayload } from "../lib/snapshot.ts";
import { absoluteRequestUrl, writeNodeResponse } from "../lib/http.ts";

test("normalizes Vercel relative request URLs", () => {
  assert.equal(
    absoluteRequestUrl("/api/frame?url=https%3A%2F%2Fexample.com", { host: "canvasfeedback-frame.vercel.app" }).href,
    "https://canvasfeedback-frame.vercel.app/api/frame?url=https%3A%2F%2Fexample.com",
  );
});

test("writes a Web Response to a Vercel Node response", async () => {
  const headers: Record<string, string> = {};
  let status = 0;
  let body = "";
  const response = {
    statusCode: 0,
    setHeader(name: string, value: string) { headers[name] = value; },
    end(value?: Uint8Array) { body = value ? Buffer.from(value).toString("utf8") : ""; },
  };
  await writeNodeResponse(new Response("Unsafe URL", { status: 400, headers: { "x-test": "yes" } }), response);
  status = response.statusCode;
  assert.equal(status, 400);
  assert.equal(headers["x-test"], "yes");
  assert.equal(body, "Unsafe URL");
});

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
