import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  // Build output folder. Set NEXT_DIST_DIR (for example .next-demo) to run a second build next to the
  // main one without touching it.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Up to 3840 px so 4K and high-density screens receive full-resolution images.
    deviceSizes: [480, 640, 828, 1080, 1280, 1600, 2048, 2560, 3840],
    qualities: [70, 75, 82, 85],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/story/:path*", headers: immutable },
      { source: "/plates/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;
