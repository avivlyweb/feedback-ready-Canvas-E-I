import { fetchTarget, proxyHeaders, rewriteHtml } from "../lib/frame.ts";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");
  if (!target) return Response.json({ error: "Missing url" }, { status: 400 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const { response, finalUrl } = await fetchTarget(target, controller.signal);
    if (!/(?:text\/html|application\/xhtml\+xml)/i.test(response.headers.get("content-type") ?? "")) {
      return new Response(null, { status: 302, headers: { location: target, "cache-control": "no-store" } });
    }
    const publicOrigin = process.env.FRAME_PUBLIC_ORIGIN || requestUrl.origin;
    const html = rewriteHtml(await response.text(), finalUrl, new URL("/agent.js", publicOrigin).href);
    return new Response(request.method === "HEAD" ? null : html, { status: 200, headers: proxyHeaders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid target";
    const unsafe = /invalid|unsupported|private|IPv6|credentials/i.test(message);
    return unsafe
      ? Response.json({ error: "Unsafe URL" }, { status: 400 })
      : new Response(null, { status: 302, headers: { location: target, "cache-control": "no-store" } });
  } finally {
    clearTimeout(timeout);
  }
}
