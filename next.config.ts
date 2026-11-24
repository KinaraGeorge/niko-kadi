import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" bundles a minimal Node server into .next/standalone,
  // so the Docker image runs on any VPS without Vercel-only features.
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Let phones on your home Wi-Fi load the dev server (npm run dev:lan).
  // Only affects `next dev`; production is unaffected.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
