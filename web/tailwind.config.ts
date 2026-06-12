import type { Config } from "tailwindcss";

// OmniMarkIt brand palette — Navy / Gold / Cream
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#05102E", 700: "#0b1c4d", 600: "#13266a" },
        gold: { DEFAULT: "#C49A2A", 400: "#d8b860" },
        cream: { DEFAULT: "#FFF2C2", 200: "#fff8e0" },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
