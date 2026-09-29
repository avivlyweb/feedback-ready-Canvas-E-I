import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSafeUrl,
  isFramingBlocked,
  proxyHeaders,
  rewriteHtml,
} from "../lib/frame.ts";

test("accepts a public HTTPS URL", () => {
  assert.equal(assertSafeUrl("https://concussion-clarity.base44.app/").hostname, "concussion-clarity.base44.app");
});

for (const unsafeUrl of [
  "ftp://example.com/file",
  "http://localhost:3000",
  "http://127.0.0.1/",
  "http://10.0.0.1/",
  "http://172.16.0.1/",
  "http://192.168.1.1/",
  "http://169.254.169.254/",
  "http://service.internal/",
  "http://printer.local/",
  "http://[::1]/",
]) {
  test(`rejects unsafe target ${unsafeUrl}`, () => {
    assert.throws(() => assertSafeUrl(unsafeUrl));
  });
}

test("detects X-Frame-Options blocking", () => {
  assert.equal(isFramingBlocked(new Headers({ "x-frame-options": "DENY" })), true);
  assert.equal(isFramingBlocked(new Headers({ "x-frame-options": "sameorigin" })), true);
});

test("detects restrictive frame-ancestors and permits wildcard", () => {
  assert.equal(isFramingBlocked(new Headers({ "content-security-policy": "default-src 'self'; frame-ancestors 'self'" })), true);
  assert.equal(isFramingBlocked(new Headers({ "content-security-policy": "frame-ancestors *" })), false);
});

test("rewrites blocked HTML for the real SPA route and absolute agent", () => {
  const result = rewriteHtml(
    "<html><head><base href='/old/'><title>Student</title></head><body>Hello</body></html>",
    new URL("https://concussion-clarity.base44.app/return-to-play?mode=student#hero"),
    "https://canvasfeedback-frame.vercel.app/agent.js",
  );

  assert.doesNotMatch(result, /href=['"]\/old\//);
  assert.match(result, /^<html><head><base href="https:\/\/concussion-clarity\.base44\.app\/">/);
  assert.match(result, /history\.replaceState\(history\.state,"",location\.origin\+"\/return-to-play\?mode=student#hero"\)/);
  assert.match(result, /<script src="https:\/\/canvasfeedback-frame\.vercel\.app\/agent\.js"><\/script>/);
});

test("does not use CSP sandbox because Base44 requires localStorage", () => {
  assert.equal(proxyHeaders().has("content-security-policy"), false);
});
