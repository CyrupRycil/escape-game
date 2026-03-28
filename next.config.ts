import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {
      resolveAlias: {
        '@': '.',
      },
    },
  },
};

export default nextConfig;