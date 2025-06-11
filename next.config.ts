import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  webpack: (config) => {
    config.module.rules.push({
      test: /pdf\.worker\.js$/,
      use: { loader: 'file-loader', options: { name: '[name].[ext]' } },
    });

    return config;
  },
};

export default nextConfig;
