/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for Vercel deployment
  images: {
    unoptimized: true,
    domains: [
      'neffbrothersstone.com',
      'leadmk.com',
      'precisionlawnandlandscape.com',
      'i.imgur.com',
      'attn2detailmercantile.com',
      'pdg.gamedaymenshealth.com'
    ],
  },
};

module.exports = nextConfig;
