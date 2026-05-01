import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        loaderCircle: {
          "0%": {
            transform: "rotate(0deg) scale(0.98)",
            opacity: "0.6",
            filter: "drop-shadow(0 0 0px rgba(255,255,255,0))",
          },
          "50%": {
            transform: "rotate(180deg) scale(1.03)",
            opacity: "1",
            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.7))",
          },
          "100%": {
            transform: "rotate(360deg) scale(0.98)",
            opacity: "0.6",
            filter: "drop-shadow(0 0 0px rgba(255,255,255,0))",
          },
        },
        loaderLetter: {
          "0%, 100%": {
            transform: "translateY(0)",
            opacity: "0.45",
            textShadow: "0 0 0 rgba(255,255,255,0)",
          },
          "50%": {
            transform: "translateY(-0.2em)",
            opacity: "1",
            textShadow: "0 0 10px rgba(255,255,255,0.9)",
          },
        },
      },
      animation: {
        "loader-circle": "loaderCircle 2.2s linear infinite",
        "loader-letter": "loaderLetter 1.25s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
