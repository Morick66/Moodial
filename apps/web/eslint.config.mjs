import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [".next/**", "next-env.d.ts", "tsconfig.tsbuildinfo", "**/._*", "**/.AppleDouble/**", "../../.tmp-*/**"]
  },
  ...nextConfig
];

export default eslintConfig;
