import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        velix: {
          primary: "#1E3A8A",
          accent: "#2563EB",
          cyan: "#22D3EE",
          dark: "#0F172A",
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
