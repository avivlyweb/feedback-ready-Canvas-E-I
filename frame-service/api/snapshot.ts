export function snapshotPayload(url: string) {
  return {
    success: true,
    url,
    discoveredPages: [],
    breakpoints: [375, 768, 1440],
  };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string") return Response.json({ error: "Missing url" }, { status: 400 });
    return Response.json(snapshotPayload(body.url), { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
