import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [".next/**", "next-env.d.ts", "tsconfig.tsbuildinfo"]
  },
  ...nextConfig
];

export default eslintConfig;
