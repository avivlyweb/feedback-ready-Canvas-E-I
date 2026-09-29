import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { patchLiveBundle } from "../scripts/patch-live-bundle.mjs";

const liveBundle = await readFile(new URL("../recovery-artifacts/index-CE_nbZlN.js", import.meta.url), "utf8");

test("patches the single live URL iframe without changing preserved features", () => {
  const origin = "https://canvasfeedback-frame.vercel.app";
  const result = patchLiveBundle(liveBundle, origin);

  assert.equal(result.replacements.component, 1);
  assert.equal(result.replacements.iframe, 1);
  assert.equal(result.replacements.listener, 1);
  assert.match(result.code, /frameOrigin="https:\/\/canvasfeedback-frame\.vercel\.app"/);
  assert.match(result.code, /frameOrigin\+"\/api\/frame\?url="/);
  assert.match(result.code, /le\.origin!==frameOrigin&&le\.origin!==studentOrigin/);
  for (const preserved of ["Staff Rubric", "Share with Student", "Export for LMS", "Fix Checklist"]) {
    assert.match(result.code, new RegExp(preserved));
  }
});

test("refuses to patch an unknown bundle", () => {
  assert.throws(() => patchLiveBundle("console.log('unknown')", "https://frame.example"));
});
