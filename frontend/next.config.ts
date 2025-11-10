import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable image optimization for Vercel deployment
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
