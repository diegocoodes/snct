import type { NextConfig } from "next";

const apiOrigin = process.env.SNCT_API_ORIGIN ?? "http://localhost:4101";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "snct.paulista.pe.gov.br",
        port: "",
        pathname: "/parceiros/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "paulista.pe.gov.br",
        port: "",
        pathname: "/wp-content/uploads/**",
        search: "",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(self), geolocation=(), microphone=(), payment=(), usb=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ];
    // HSTS is applied per-request in src/proxy.ts only when the request is HTTPS.
    // Emitting it unconditionally here breaks CSS/JS for plain-HTTP access (IP:port).
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
