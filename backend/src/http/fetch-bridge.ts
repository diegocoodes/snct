import type { IncomingMessage, ServerResponse } from "node:http";

import { fromNodeHeaders } from "better-auth/node";

export async function toFetchRequest(
  req: IncomingMessage,
  absoluteUrl: string,
): Promise<Request> {
  const method = (req.method ?? "GET").toUpperCase();
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);
  const headers = fromNodeHeaders(req.headers);

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = body;
    init.duplex = "half";
  }

  return new Request(absoluteUrl, init);
}

export async function sendFetchResponse(
  response: Response,
  res: ServerResponse,
) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

export function absoluteUrl(req: IncomingMessage, pathWithQuery: string) {
  const host = req.headers.host ?? "127.0.0.1:4001";
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto =
    typeof protoHeader === "string" && protoHeader.length > 0
      ? protoHeader.split(",")[0].trim()
      : "http";
  return `${proto}://${host}${pathWithQuery}`;
}
