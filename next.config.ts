import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/chinese-character-learning',
  images: { unoptimized: true },
};

export default nextConfig;
