import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

export function assertSafeUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported protocol");
  if (url.username || url.password) throw new Error("Credentials are not allowed");

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Private hostname");
  }
  if (hostname.includes(":")) throw new Error("IPv6 targets are not allowed");
  if (isIP(hostname) === 4 && PRIVATE_V4.some((pattern) => pattern.test(hostname))) throw new Error("Private address");
  return url;
}

export async function assertPublicDestination(url: URL): Promise<void> {
  if (isIP(url.hostname) === 4) return;
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0) throw new Error("Host did not resolve");
  for (const { address, family } of addresses) {
    if (family === 6 || address.includes(":")) throw new Error("IPv6 destination is not allowed");
    if (PRIVATE_V4.some((pattern) => pattern.test(address))) throw new Error("Private destination");
  }
}

export function isFramingBlocked(headers: Headers): boolean {
  const xfo = headers.get("x-frame-options") ?? "";
  if (/(^|[\s,])(deny|sameorigin)([\s,]|$)/i.test(xfo)) return true;

  const csp = headers.get("content-security-policy") ?? "";
  const directive = csp.split(";").map((value) => value.trim()).find((value) => /^frame-ancestors(?:\s|$)/i.test(value));
  if (!directive) return false;
  const sources = directive.split(/\s+/).slice(1);
  return !sources.includes("*");
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function rewriteHtml(html: string, finalUrl: URL, agentUrl: string): string {
  const withoutBase = html.replace(/<base\b[^>]*>/gi, "");
  const baseUrl = `${finalUrl.origin}/`;
  const route = `${finalUrl.pathname}${finalUrl.search}${finalUrl.hash}`;
  const serializedRoute = JSON.stringify(route).replaceAll("<", "\\u003c");
  const headPrefix = `<base href="${escapeAttribute(baseUrl)}"><script>try{history.replaceState(history.state,"",${serializedRoute})}catch(e){}</script>`;
  const agent = `<script src="${escapeAttribute(agentUrl)}"></script>`;

  let rewritten: string;
  if (/<head\b[^>]*>/i.test(withoutBase)) {
    rewritten = withoutBase.replace(/<head\b([^>]*)>/i, `<head$1>${headPrefix}`);
  } else if (/<html\b[^>]*>/i.test(withoutBase)) {
    rewritten = withoutBase.replace(/<html\b([^>]*)>/i, `<html$1><head>${headPrefix}</head>`);
  } else {
    rewritten = `<head>${headPrefix}</head>${withoutBase}`;
  }

  return /<\/body\s*>/i.test(rewritten)
    ? rewritten.replace(/<\/body\s*>/i, `${agent}</body>`)
    : `${rewritten}${agent}`;
}

export interface TargetResult {
  response: Response;
  finalUrl: URL;
}

export async function fetchTarget(input: string, signal: AbortSignal, maxRedirects = 5): Promise<TargetResult> {
  let current = assertSafeUrl(input);
  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    await assertPublicDestination(current);
    const response = await fetch(current, {
      headers: { "user-agent": "CanvasFeedback-Frame/1.0" },
      redirect: "manual",
      signal,
    });
    if (response.status < 300 || response.status >= 400) return { response, finalUrl: current };
    const location = response.headers.get("location");
    if (!location) return { response, finalUrl: current };
    current = assertSafeUrl(new URL(location, current).href);
  }
  throw new Error("Too many redirects");
}

export const PROXY_CSP = "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads";

export function proxyHeaders(): Headers {
  return new Headers({
    "cache-control": "no-store",
    "content-security-policy": PROXY_CSP,
    "content-type": "text/html; charset=utf-8",
    "referrer-policy": "no-referrer",
    "x-canvasfeedback-mode": "proxied",
  });
}
