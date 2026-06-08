import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@jzmle/core", "@jzmle/db", "@jzmle/prompts"]
};

export default nextConfig;
