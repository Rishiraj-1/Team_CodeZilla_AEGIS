import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Disable type checking during production builds (speeds up builds significantly)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
