/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // You can enable static export if you remove server routes (Stripe).
  // For Vercel deployment with API routes, keep this as default.
};

module.exports = nextConfig;
