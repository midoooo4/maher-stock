import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Complexe Maher Official Branding
        brand: {
          orange: "#E99B39",
          "orange-hover": "#D3882B",
          "orange-light": "#FDF4E7",
          navy: "#151936",
          "navy-light": "#1E244D",
          "navy-dark": "#0D1024",
          turquoise: "#43A9B7",
          "turquoise-hover": "#368F9B",
          "turquoise-light": "#E9F6F8",
          bg: "#F5F5F3",
          surface: "#FFFFFF",
          muted: "#6B7280",
          border: "#E5E7EB",
          danger: "#DC2626",
          success: "#10B981",
          warning: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        arabic: ["var(--font-arabic)", "Cairo", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(21, 25, 54, 0.06), 0 1px 4px -1px rgba(21, 25, 54, 0.04)",
        dropdown: "0 10px 25px -5px rgba(21, 25, 54, 0.12), 0 8px 10px -6px rgba(21, 25, 54, 0.08)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
