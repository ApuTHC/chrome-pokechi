// S1 — TypeScript mirror of src/styles/tokens.css, for the one surface
// that cannot load a stylesheet: the floating pet builds its shadow-DOM
// CSS from a template string. Same values as the CSS file (camelCase
// names); when a color changes, change it in BOTH files — together they
// are the design system, and every Pokechi surface reads from them.
export const DESIGN_TOKENS = {
  // Surfaces
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  surface: '#334155',
  surfaceRaised: '#475569',
  cardGlass: 'rgba(30, 41, 59, 0.7)',

  // Text
  textPrimary: '#f8fafc',
  textStrong: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  // S3: was #64748b (3.06:1 on --bg-secondary). Keep identical to the
  // --muted-text token in src/styles/tokens.css.
  mutedText: '#8593a9',
  textDim: 'rgba(255, 255, 255, 0.75)',

  // Accents
  accent: '#38bdf8',
  accentIndigo: '#818cf8',
  accentSoft: 'rgba(56, 189, 248, 0.1)',
  gold: '#facc15',

  // Semantic feedback colors (XP badge / milestone toast on the pet,
  // toggle "on" state in the popup)
  success: '#10b981',
  successDark: '#059669',
  successGlow: 'rgba(16, 185, 129, 0.4)',
  warning: '#f59e0b',
  warningDark: '#d97706',
  warningGlow: 'rgba(245, 158, 11, 0.45)',

  // Lines & overlays
  borderGlass: 'rgba(255, 255, 255, 0.18)',
  hoverWash: 'rgba(255, 255, 255, 0.15)',
  trackFill: 'rgba(255, 255, 255, 0.14)',
  panelGlass: 'rgba(18, 20, 29, 0.92)',

  // Type
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  // Gradients composed from the tokens above (kept here so the template
  // never spells the stops out itself)
  gradXp: 'linear-gradient(90deg, #38bdf8, #818cf8)',
} as const
