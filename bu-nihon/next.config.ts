import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    const origin = new URL(target);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
      throw new Error('API_PROXY_TARGET must be an http(s) origin without a path');
    }
    return [{ source: '/api/:path*', destination: `${origin.origin}/api/:path*` }];
  },
};

export default nextConfig;
