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
    // The backend binds 127.0.0.1; `localhost` resolves to ::1 on some hosts.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
  },
};

export default nextConfig;
