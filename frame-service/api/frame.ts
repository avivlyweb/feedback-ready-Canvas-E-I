import { fetchTarget, isFramingBlocked, proxyHeaders, rewriteHtml } from "../lib/frame.js";
import { absoluteRequestUrl, writeNodeResponse, type NodeResponseLike } from "../lib/http.js";

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}

interface NodeRequestLike {
  method?: string;
  url?: string;
  headers: Headers | Record<string, string | string[] | undefined>;
}

async function handle(request: NodeRequestLike): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });

  const requestUrl = absoluteRequestUrl(request.url || "/", request.headers);
  const target = requestUrl.searchParams.get("url");
  if (!target) return json({ error: "Missing url" }, 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const { response, finalUrl } = await fetchTarget(target, controller.signal);
    const contentType = response.headers.get("content-type") ?? "";
    const blocked = isFramingBlocked(response.headers);
    const proxied = blocked && /(?:text\/html|application\/xhtml\+xml)/i.test(contentType);

    if (requestUrl.searchParams.get("check") === "1") {
      return json({ mode: proxied ? "proxied" : "direct", url: finalUrl.href });
    }
    if (!proxied) return new Response(null, { status: 302, headers: { location: target, "cache-control": "no-store" } });

    const publicOrigin = process.env.FRAME_PUBLIC_ORIGIN || requestUrl.origin;
    const html = rewriteHtml(await response.text(), finalUrl, new URL("/agent.js", publicOrigin).href);
    const headers = proxyHeaders();
    headers.set("access-control-expose-headers", "x-canvasfeedback-mode");
    return new Response(request.method === "HEAD" ? null : html, { status: 200, headers });
  } catch (error) {
    if (requestUrl.searchParams.get("check") === "1") return json({ mode: "direct", url: target });
    const message = error instanceof Error ? error.message : "Invalid target";
    if (/invalid|unsupported|private|IPv6|credentials/i.test(message)) return json({ error: "Unsafe URL" }, 400);
    return new Response(null, { status: 302, headers: { location: target, "cache-control": "no-store" } });
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request: NodeRequestLike, response: NodeResponseLike): Promise<void> {
  await writeNodeResponse(await handle(request), response);
}
