import type { NextConfig } from "next";
import path from "path";

const canvasStubPath = path.join(process.cwd(), "src", "lib", "canvas-stub.ts");

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      canvas: "src/lib/canvas-stub.ts",
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = { ...config.resolve.alias, canvas: canvasStubPath };
    return config;
  },
};

export default nextConfig;
