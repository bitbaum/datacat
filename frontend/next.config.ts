import type { NextConfig } from 'next';
import { withContentlayer } from 'next-contentlayer';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    // Proxy API requests to the backend only when BACKEND_URL is provided.
    const backendBase = process.env.BACKEND_URL;
    // Ensure we don't accidentally double-add `/api` if provided.
    if (backendBase) {
      const sanitizedBase = backendBase.replace(/\/$/, '');
      return [
        {
          source: '/api/:path*',
          destination: `${sanitizedBase}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default withContentlayer(nextConfig);
