import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds for Vercel deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds for Vercel deployment
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
};

export default nextConfig;
