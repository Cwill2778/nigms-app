import type { Config } from "tailwindcss";

/**
 * NAILED IT GENERAL MAINTENANCE — Tailwind v4 Config
 * Industrial Noir Design System
 *
 * All color tokens are defined as CSS variables in globals.css.
 * This config wires them into Tailwind utility classes so you can use:
 *   bg-bg-surface, text-accent-orange, border-steel-mid, etc.
 *
 * Brand tokens (Requirement 1.1):
 *   bg-trust-navy, text-trust-navy
 *   bg-precision-coral, text-precision-coral
 *   bg-architectural-gray, text-architectural-gray
 *   bg-steel-gray, text-steel-gray
 *   bg-status-gold, text-status-gold
 *   bg-status-green, text-status-green
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Nailed It Brand Tokens (Requirement 1.1) ──
        "trust-navy": "#1B263B",
        "precision-coral": "#FF7F7F",
        "architectural-gray": "#F4F5F7",
        "steel-gray": "#778DA9",
        "status-gold": "#F59E0B",
        "status-green": "#22C55E",
      },
      fontFamily: {
        // ── Typography (Requirement 1.2) ──
        heading: ["var(--font-heading)", "Montserrat", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
