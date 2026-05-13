import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Ensure the swisseph-wasm .wasm and .data files are included in the
  // serverless function bundle on Vercel (file tracing can miss them).
  outputFileTracingIncludes: {
    "/*": ["./node_modules/swisseph-wasm/wasm/**/*"],
  },
};

export default nextConfig;
