import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (default in Next.js 16) needs its own alias config
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  },
};

export default nextConfig;
