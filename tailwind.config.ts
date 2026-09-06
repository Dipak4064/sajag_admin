import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        critical: "hsl(var(--critical))",
        warning: "hsl(var(--warning))",
        safe: "hsl(var(--safe))",
        info: "hsl(var(--info))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      boxShadow: {
        /* Brand emphasis — default for non-emergency CTAs and active chrome */
        "glow-cyan": "0 0 0 1px hsl(188 86% 53% / 0.3), 0 0 34px -8px hsl(188 86% 53% / 0.6)",
        /* Reserved for live hazards / SOS only */
        "glow-red": "0 0 0 1px hsl(0 84% 60% / 0.3), 0 0 34px -6px hsl(0 84% 60% / 0.6)",
        "glow-emerald": "0 0 0 1px hsl(160 84% 39% / 0.28), 0 0 28px -8px hsl(160 84% 39% / 0.5)",
        "glow-blue": "0 0 0 1px hsl(199 89% 60% / 0.28), 0 0 28px -8px hsl(199 89% 60% / 0.5)",
        "glow-amber": "0 0 0 1px hsl(38 92% 50% / 0.28), 0 0 28px -8px hsl(38 92% 50% / 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
