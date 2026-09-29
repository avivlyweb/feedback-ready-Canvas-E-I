import { writeNodeResponse, type NodeResponseLike } from "../lib/http.js";
import { snapshotPayload } from "../lib/snapshot.js";

interface NodeRequestLike {
  method?: string;
  body?: unknown;
}

async function handle(request: NodeRequestLike): Promise<Response> {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const body = (typeof request.body === "string" ? JSON.parse(request.body) : request.body) as { url?: unknown };
    if (typeof body.url !== "string") return Response.json({ error: "Missing url" }, { status: 400 });
    return Response.json(snapshotPayload(body.url), { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

export default async function handler(request: NodeRequestLike, response: NodeResponseLike): Promise<void> {
  await writeNodeResponse(await handle(request), response);
}
