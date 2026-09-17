/**
 * Design token untuk seluruh produk Scaff (web publik, admin panel, CLI).
 * Sumber kebenaran: docs/16-design-system-ui-guideline.md
 *
 * Versi CSS (Tailwind v4 @theme) ada di ./styles/theme.css.
 * Objek TypeScript di bawah ini tersedia untuk pemakaian di luar CSS
 * (misal inline style, chart, dsb).
 */

export const designTokens = {
  background: "#0A0A0B",
  backgroundSecondary: "#131316",
  border: "#26262B",
  foreground: "#FAFAFA",
  foregroundMuted: "#A1A1AA",
  accent: "#8B5CF6",
  accentHover: "#7C3AED",
  accentMuted: "#8B5CF633",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#EAB308",
} as const;

export type DesignToken = keyof typeof designTokens;