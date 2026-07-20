import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
