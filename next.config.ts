import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hosted on Vercel — CVE-2026-44578 (WebSocket SSRF) is Vercel-exempt.
  // If you ever self-host, upgrade to Next.js 16.2.6+ and restrict SSRF surface.
  experimental: {
    // Required for React 19 server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
