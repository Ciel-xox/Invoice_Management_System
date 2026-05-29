import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f5f4ef",
        surface: "#ffffff",
        surface2: "#f1efe8",
        ink: {
          DEFAULT: "#1f1e1b",
          2: "#5f5e5a",
          3: "#888780",
        },
        line: "rgba(0,0,0,.12)",
        line2: "rgba(0,0,0,.22)",
        info: { DEFAULT: "#185fa5", bg: "#e6f1fb", strong: "#378add" },
        success: { DEFAULT: "#0f6e56", bg: "#e1f5ee" },
        warning: "#854f0b",
        danger: "#a32d2d",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        sans: [
          "-apple-system",
          '"Helvetica Neue"',
          '"Hiragino Sans"',
          '"Noto Sans JP"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
