import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2f2926",
        paper: "#fbf5ef",
        mist: "#e6eef0",
        moss: "#71816d",
        clay: "#c57c66",
        dusk: "#756f77",
        blush: "#f7ded8",
        rosewood: "#9d5d58",
        sage: "#dce8dc",
        morning: "#edf4f7"
      },
      boxShadow: {
        button: "0 2px 8px rgba(36, 33, 29, 0.08)",
        card: "0 2px 10px rgba(36, 33, 29, 0.05)",
        shell: "0 24px 80px rgba(97, 74, 66, 0.12)",
        soft: "0 12px 40px rgba(97, 74, 66, 0.08)",
        gentle: "0 18px 45px rgba(97, 74, 66, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
