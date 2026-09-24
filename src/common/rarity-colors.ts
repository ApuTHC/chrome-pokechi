import { PokemonRarity } from './types'

// Shared with the Pokedex card borders, so a species reads as the same rarity
// everywhere it shows up.
export const RARITY_COLORS: Record<PokemonRarity, string> = {
  [PokemonRarity.subLegendary]: '#5EC8F2',
  [PokemonRarity.legendary]: '#E3A008',
  [PokemonRarity.mythical]: '#C77DFF',
  [PokemonRarity.fossil]: '#B08968',
}

// A rule per rarity for a given selector base (e.g. ".pokemon-card" ->
// ".pokemon-card.rarity-legendary { border-color: ...; }"). The colours
// themselves are exposed as custom properties (getRarityCssVariables) so
// the variants a stylesheet has to express on its own — hover borders,
// the active card's inset glow — can use the same single source instead of
// re-spelling a hex. build.js writes both halves to dist/rarity-borders.css.
export function getRarityBorderCssRules(selector: string): string {
  return Object.entries(RARITY_COLORS)
    .map(([rarity, color]) => `${selector}.rarity-${rarity} { border-color: ${color}; }`)
    .join('\n')
}

// ":root { --rarity-sub-legendary: #5EC8F2; ... }" — same data as above,
// formatted for a stylesheet's variable block.
export function getRarityCssVariables(indent = '  '): string {
  return Object.entries(RARITY_COLORS)
    .map(([rarity, color]) => `${indent}--rarity-${rarity}: ${color};`)
    .join('\n')
}
