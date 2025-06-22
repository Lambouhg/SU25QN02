import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cấu hình cho images từ Clerk
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // CORS headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config) => {
    // PDF.js configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf',
    };

    return config;
  },

  // External packages configuration
  serverExternalPackages: ['pdf2json'],
};

export default nextConfig;
