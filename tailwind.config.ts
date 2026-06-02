import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3362FF",
          50: "#EEF2FF",
          100: "#DCE4FF",
          200: "#B8C8FF",
          300: "#8BA4FF",
          400: "#5C81FF",
          500: "#3362FF",
          600: "#2850D6",
          700: "#1F3FAA",
          800: "#172E7E",
          900: "#0F1E55"
        },
        bg: "#F7F9FC",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          subtle: "#94A3B8"
        },
        border: "#E2E8F0",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
        pop: "0 8px 32px rgba(51, 98, 255, 0.18)"
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" }
        }
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 240ms ease-out",
        shimmer: "shimmer 1.4s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
