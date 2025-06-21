import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  },  webpack: (config, { isServer }) => {
    // Handle PDF.js worker files
    config.module.rules.push({
      test: /pdf\.worker\.js$/,
      use: { loader: 'file-loader', options: { name: '[name].[ext]' } },
    });

    // Handle PDF.js in server and client builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
      };
    }

    // Externalize heavy dependencies for server builds
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }

    return config;
  },
};

export default nextConfig;
