type HeaderSource = Headers | Record<string, string | string[] | undefined>;

function headerValue(headers: HeaderSource, name: string): string | undefined {
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function absoluteRequestUrl(input: string, headers: HeaderSource): URL {
  if (/^https?:\/\//i.test(input)) return new URL(input);
  const forwardedHost = headerValue(headers, "x-forwarded-host");
  const host = forwardedHost || headerValue(headers, "host") || "canvasfeedback-frame.vercel.app";
  const protocol = headerValue(headers, "x-forwarded-proto") || "https";
  return new URL(input, `${protocol}://${host}`);
}

export interface NodeResponseLike {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: Uint8Array): void;
}

export async function writeNodeResponse(source: Response, target: NodeResponseLike): Promise<void> {
  target.statusCode = source.status;
  source.headers.forEach((value, name) => target.setHeader(name, value));
  const body = source.body ? new Uint8Array(await source.arrayBuffer()) : undefined;
  target.end(body);
}
