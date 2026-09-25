import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The starter lives below a home directory that can contain unrelated lockfiles.
  // Pin both build roots so the official baseline is reproducible before students
  // intentionally move the app into a monorepo workspace.
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
