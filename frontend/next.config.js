/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for Vercel deployment
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
