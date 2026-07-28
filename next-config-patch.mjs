// Merge this setting into your existing next.config.mjs.
// Do not overwrite other config values already in your project.

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
