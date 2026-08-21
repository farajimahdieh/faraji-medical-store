import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dev-only: product images are served by the API's local storage on
    // localhost. Point this at the real media host/CDN before production —
    // dangerouslyAllowLocalIP only matters for this localhost case and can
    // be removed once that happens.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3001", pathname: "/media/**" },
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
