import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#111827",
          light: "#1f2937",
          accent: "#2563eb",
        },
      },
    },
  },
  plugins: [],
};

export default config;
