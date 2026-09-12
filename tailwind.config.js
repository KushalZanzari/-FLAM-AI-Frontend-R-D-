/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        // Dark mode base palette — warm obsidian & charcoal
        surface: {
          950: "#0c0c0e",
          900: "#121215",
          800: "#18181c",
          700: "#222228",
          600: "#2d2d34",
          500: "#3d3d46",
          400: "#52525c",
        },
        // Primary accent — rich amber & bronze
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Secondary — warm terracotta / burnt orange
        secondary: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        // Success/revenue — crisp forest emerald
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        // Earthy stone neutral
        stone: {
          850: "#1f1d1b",
          900: "#1c1917",
          950: "#0c0a09",
        },
        // Categorical chart palette
        chart: {
          amber: "#f59e0b",
          terracotta: "#ea580c",
          emerald: "#10b981",
          coral: "#f43f5e",
          sage: "#84cc16",
          bronze: "#b45309",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)",
        card: "0 2px 8px -2px rgba(0, 0, 0, 0.4), 0 1px 3px 0 rgba(0, 0, 0, 0.2)",
        lifted: "0 8px 24px -4px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
