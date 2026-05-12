import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Native modules with prebuilt binaries must be kept external so node-gyp-build
  // can resolve the correct ABI binary at runtime instead of being bundled.
  serverExternalPackages: ["sweph"],
};

export default nextConfig;
