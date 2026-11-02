import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
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
      { source: "/story/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/legacy/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
    ];
  },
  async redirects() {
    // Keep old WordPress URLs working (and their search rankings).
    return [
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/treatment-and-care", destination: "/treatments", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/blogs", destination: "/knowledge-centre", permanent: true },
      { source: "/best-ivf-center-in-mysore", destination: "/", permanent: true },
      { source: "/thank-you", destination: "/contact", permanent: true },
      { source: "/ivf-for-couples-over-35-challenges-and-solutions", destination: "/knowledge-centre/ivf-after-35", permanent: true },
      { source: "/common-ivf-myths-and-facts-everything-you-need-to-know", destination: "/knowledge-centre/ivf-myths-and-facts", permanent: true },
      { source: "/how-to-choose-the-best-ivf-specialist-and-fertility-clinic-in-mysuru", destination: "/knowledge-centre/choosing-a-fertility-clinic", permanent: true },
      { source: "/best-time-to-start-ivf-a-step-by-step-fertility-journey", destination: "/knowledge-centre/when-to-consider-ivf", permanent: true },
      { source: "/ivf-treatment-a-comprehensive-guide-to-success-rates-and-cost-in-mysore", destination: "/knowledge-centre/ivf-success-rates-and-costs", permanent: true },
    ];
  },
};

export default nextConfig;
