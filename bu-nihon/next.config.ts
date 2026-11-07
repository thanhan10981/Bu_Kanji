import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3001' : undefined);
    if (!target) return [];
    const origin = new URL(target);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
      throw new Error('API_PROXY_TARGET must be an http(s) origin without a path');
    }
    // Dynamic AI handlers must resolve in Next before forwarding backend APIs.
    return { fallback: [{ source: '/api/:path*', destination: `${origin.origin}/api/:path*` }] };
  },
};

export default nextConfig;
