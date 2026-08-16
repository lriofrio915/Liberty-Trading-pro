import type { Config } from "tailwindcss";

/**
 * Los tokens de marca viven en app/globals.css como CSS custom properties
 * (`:root` y `html.light`). Aquí solo se exponen a Tailwind para poder escribir
 * `text-gold` o `bg-panel` en vez de `text-[var(--gold)]`.
 *
 * globals.css sigue siendo la fuente de verdad: cambiar un color ahí actualiza
 * ambos sistemas y respeta el modo claro automáticamente.
 *
 * Referencia: /branding/04-design-tokens.md
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
          dark: "var(--gold-dark)",
        },
        ink: "var(--bg-primary)",
        surface: "var(--bg-secondary)",
        panel: "var(--bg-card)",
        hover: "var(--bg-hover)",
        line: "var(--border)",
        ink1: "var(--text-primary)",
        ink2: "var(--text-secondary)",
        ink3: "var(--text-muted)",
        profit: "var(--green)",
        loss: "var(--red)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
