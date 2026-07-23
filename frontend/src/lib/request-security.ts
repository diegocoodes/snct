import { createHmac } from "node:crypto";
import { APIError } from "better-auth/api";

import { query } from "@/lib/db";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function configuredOrigins(request: Request) {
  const values = new Set<string>();
  const configured = [
    process.env.BETTER_AUTH_URL,
    ...(process.env.SNCT_TRUSTED_ORIGINS?.split(",") ?? []),
  ];
  for (const value of configured) {
    if (!value?.trim()) continue;
    try {
      values.add(new URL(value.trim()).origin);
    } catch {
      // Ignore malformed optional origins; deployment validation reports them.
    }
  }
  if (process.env.NODE_ENV !== "production") {
    values.add(new URL(request.url).origin);
  }
  return values;
}

export function assertTrustedMutation(request: Request) {
  if (!unsafeMethods.has(request.method.toUpperCase())) return;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    throw new Response("Origem não autorizada.", { status: 403 });
  }

  const origin = request.headers.get("origin");
  const allowedOrigins = configuredOrigins(request);
  if (!origin || !allowedOrigins.has(origin)) {
    throw new Response("Origem não autorizada.", { status: 403 });
  }

  if (request.headers.get("x-snct-request") !== "1") {
    throw new Response("Cabeçalho de segurança ausente.", { status: 403 });
  }
}

export function getRequestAddress(request: Request) {
  if (process.env.SNCT_TRUST_PROXY === "true") {
    return (
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown"
    );
  }
  return "direct";
}

function securityHash(value: string) {
  const secret =
    process.env.SNCT_RATE_LIMIT_SECRET ??
    process.env.BETTER_AUTH_SECRET ??
    process.env.SNCT_SESSION_SECRET;
  if (!secret) throw new Error("Segredo de rate limiting não configurado.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function enforceRateLimit(options: {
  request: Request;
  scope: string;
  identifier?: string;
  limit: number;
  windowSeconds: number;
}) {
  const address = getRequestAddress(options.request);
  const identifier = options.identifier?.trim().toLowerCase() ?? "anonymous";
  const key = securityHash(`${options.scope}:${address}:${identifier}`);

  const result = await query<{ request_count: number; retry_after: number }>(
    `
      INSERT INTO rate_limits
        (rate_key, request_count, window_started_at, expires_at)
      VALUES (?, 1, NOW(3), DATE_ADD(NOW(3), INTERVAL ? SECOND))
      ON DUPLICATE KEY UPDATE
        request_count = IF(expires_at <= NOW(3), 1, request_count + 1),
        window_started_at = IF(expires_at <= NOW(3), NOW(3), window_started_at),
        expires_at = IF(
          expires_at <= NOW(3),
          DATE_ADD(NOW(3), INTERVAL ? SECOND),
          expires_at
        )
    `,
    [key, options.windowSeconds, options.windowSeconds],
  );

  const state = await query<{ request_count: number; retry_after: number }>(
    `
      SELECT request_count,
             GREATEST(1, CEIL(TIMESTAMPDIFF(SECOND, NOW(3), expires_at))) AS retry_after
      FROM rate_limits
      WHERE rate_key = ?
    `,
    [key],
  );

  const current = state.rows[0];
  if (!current || current.request_count > options.limit) {
    throw new Response("Muitas tentativas. Aguarde e tente novamente.", {
      status: 429,
      headers: { "Retry-After": String(current?.retry_after ?? 1) },
    });
  }

  void result;
}

export function hashAuditAddress(request: Request) {
  return securityHash(getRequestAddress(request));
}

export function securityErrorResponse(error: unknown) {
  if (error instanceof Response) return error;
  if (error instanceof APIError) {
    const status =
      error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 400;
    const message =
      status === 401
        ? "Credenciais inválidas."
        : status === 429
          ? "Muitas tentativas. Aguarde e tente novamente."
          : "Não foi possível concluir a operação.";
    return Response.json({ error: message }, { status });
  }
  return Response.json(
    { error: "Não foi possível concluir a operação." },
    { status: 500 },
  );
}
