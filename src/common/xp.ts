// Pure XP thresholds shared by the background and the UI bundles.
//
// This lives in common/ (not background/game-logic.ts) on purpose: the
// content script needs getRequiredXPForLevel for the pet's XP bar, and
// importing it from game-logic dragged the whole background graph into the
// bundle injected into every page — the 8 i18n dictionaries, badges, items
// and the evolution tables. A dependency-free module keeps dist/content.js
// lean.
export const DEFAULT_XP_FOR_POKEBALL = 500
export const DEFAULT_XP_FOR_FIRST_EVOLUTION = 1000
export const DEFAULT_XP_FOR_SECOND_EVOLUTION = 2000

export function getRequiredXPForLevel(level: number): number {
  if (level === 0) {
    return DEFAULT_XP_FOR_POKEBALL
  }
  if (level === 1) {
    return DEFAULT_XP_FOR_FIRST_EVOLUTION
  }
  if (level === 2) {
    return DEFAULT_XP_FOR_SECOND_EVOLUTION
  }
  return DEFAULT_XP_FOR_SECOND_EVOLUTION + (level - 2) * 50
}

// Fractional multipliers (x1.3 badges, stacked challenge bonuses) grant
// float-dusted amounts (7 x 2.3 = 16.099999999999998). Round to 2 decimals
// for display; plain interpolation then drops trailing zeros (6.5 stays
// "6.5", 13 stays "13"). Stored XP keeps full precision.
export function trimXPDecimals(value: number): number {
  return Math.round(value * 100) / 100
}
