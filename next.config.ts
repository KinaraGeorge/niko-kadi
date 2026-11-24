import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" bundles a minimal Node server into .next/standalone,
  // so the Docker image runs on any VPS without Vercel-only features.
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
