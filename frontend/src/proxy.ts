import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

function contentSecurityPolicy(nonce: string) {
  const additionalImageSources =
    process.env.SNCT_ALLOWED_IMAGE_HOSTS?.split(",")
      .map((host) => host.trim().toLowerCase())
      .filter((host) => /^[a-z0-9.-]+$/.test(host))
      .map((host) => `https://${host}`)
      .join(" ") ?? "";
  const directives = [
    "default-src 'self'",
    process.env.NODE_ENV === "production"
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://paulista.pe.gov.br https://snct.paulista.pe.gov.br ${additionalImageSources}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src https://www.google.com https://maps.google.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
  ];
  return directives.filter(Boolean).join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), geolocation=(), microphone=(), payment=(), usb=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
