import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'https://lalapay-api.vercel.app/:path*',
      },
    ];
  },
};

export default nextConfig;
