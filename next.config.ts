import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'e.snmc.io',
      },
      {
        protocol: 'https',
        hostname: '*.rateyourmusic.com',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
    ],
  },
}

export default nextConfig
