import type { NextConfig } from "next";

// Optional: set once a CDN custom domain is put in front of storage (see
// STORAGE_PUBLIC_BASE_URL in the API's .env) so next/image accepts it too,
// without another code change.
const extraMediaHostname = process.env.NEXT_PUBLIC_MEDIA_HOSTNAME;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Dev-only: product images served by the API's local storage.
      // dangerouslyAllowLocalIP only matters for this case.
      { protocol: "http", hostname: "localhost", port: "3001", pathname: "/media/**" },
      // Admin-uploaded product images, served directly from ArvanCloud
      // Object Storage (wildcarded so a region change doesn't need a code
      // change either) -- see storage/arvan-s3-storage.provider.ts.
      { protocol: "https", hostname: "**.arvanstorage.ir", pathname: "/**" },
      ...(extraMediaHostname
        ? [{ protocol: "https" as const, hostname: extraMediaHostname, pathname: "/**" }]
        : []),
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
