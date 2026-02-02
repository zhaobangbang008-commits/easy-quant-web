import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // ⚠️ 警告：忽略 TypeScript 报错，强制打包
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ 警告：忽略代码格式报错
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;