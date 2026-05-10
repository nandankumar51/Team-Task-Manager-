import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        muted: "#64748b",
        line: "#dbe3ef",
        panel: "#ffffff",
        canvas: "#f5f7fb",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          900: "#172554"
        },
        accent: {
          50: "#ecfeff",
          500: "#0891b2",
          600: "#0e7490",
          700: "#0f6674"
        },
        success: {
          50: "#ecfdf5",
          600: "#059669",
          700: "#047857"
        },
        warning: {
          50: "#fffbeb",
          600: "#d97706",
          700: "#b45309"
        },
        danger: {
          50: "#fef2f2",
          600: "#dc2626",
          700: "#b91c1c"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        card: "0 1px 2px rgba(15, 23, 42, 0.05), 0 12px 32px rgba(15, 23, 42, 0.07)",
        lift: "0 24px 70px rgba(15, 23, 42, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
