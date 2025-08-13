import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Путь, который вы будете использовать в вашем фронтенд-коде
        source: '/api/pos/:path*',
        // Цель: реальный адрес вашего POS-терминала
        destination: 'https://192.168.0.109:8080/:path*', 
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  webpack(config) {
     
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      rule.test?.test?.(".svg"),
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ["@svgr/webpack"],
      },
    );

    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

export default nextConfig;
