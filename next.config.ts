import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Disable type checking during production builds (speeds up builds significantly)
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Strip 'node:' protocol prefix so webpack resolves them as standard modules
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );
      
      // Tell Webpack not to bundle these Node-specific modules in the client build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        module: false,
        worker_threads: false,
      };
    }
    return config;
  },
};

export default nextConfig;
