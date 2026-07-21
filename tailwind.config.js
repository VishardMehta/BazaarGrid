/**
 * BazaarGrid — "Modern Agrarian" design tokens.
 * Source of truth: repo-root DESIGN.md (YAML frontmatter). Keep in sync.
 * Confirmed against the Stitch HTML exports in design/screens/.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Material-3 style tonal palette from DESIGN.md
        surface: {
          DEFAULT: "#faf9f5",
          dim: "#dbdad6",
          bright: "#faf9f5",
          lowest: "#ffffff",
          low: "#f4f4f0",
          container: "#efeeea",
          high: "#e9e8e4",
          highest: "#e3e2df",
          variant: "#e3e2df",
        },
        "on-surface": {
          DEFAULT: "#1b1c1a",
          variant: "#56423e",
        },
        primary: {
          DEFAULT: "#9d3d2e", // terracotta
          container: "#bd5444",
          on: "#ffffff",
          "on-container": "#fffbff",
          fixed: "#ffdad4",
          "fixed-dim": "#ffb4a7",
          inverse: "#ffb4a7",
          tint: "#a03f30",
        },
        secondary: {
          DEFAULT: "#48654e", // deep green
          container: "#c7e8cb",
          on: "#ffffff",
          "on-container": "#4c6952",
          fixed: "#caebce",
          "fixed-dim": "#aecfb3",
        },
        tertiary: {
          DEFAULT: "#7c5800", // turmeric
          container: "#9b6f01",
          on: "#ffffff",
          "on-container": "#080400",
          fixed: "#ffdea7",
          "fixed-dim": "#f4be55",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
          on: "#ffffff",
          "on-container": "#93000a",
        },
        outline: {
          DEFAULT: "#89726d",
          variant: "#ddc0bb",
        },
        inverse: {
          surface: "#2f312e",
          "on-surface": "#f2f1ed",
        },
      },
      fontFamily: {
        serif: ['"Newsreader"', "ui-serif", "Georgia", "serif"],
        sans: ['"Work Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "500" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "1.2", fontWeight: "500" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      spacing: {
        "token-xs": "4px",
        "token-base": "8px",
        "token-sm": "12px",
        "token-md": "24px",
        "token-lg": "48px",
        "token-xl": "80px",
        gutter: "24px",
        "container-margin": "32px",
      },
      maxWidth: {
        container: "1280px",
      },
      boxShadow: {
        // tinted ambient "deep green" shadow — earthy, not grey/black
        tinted: "0 4px 16px -2px rgba(72, 101, 78, 0.12)",
        "tinted-lg": "0 12px 32px -4px rgba(72, 101, 78, 0.16)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
