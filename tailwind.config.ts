import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bu: {
          red: "#CC0000",
          dark: "#8A0000",
          soft: "#FFF1F1",
        },
        ink: "#1F2937",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(31, 41, 55, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
