import { POKEMON_DATA } from './pokemon-data'
import { PokemonColor, PokemonElementType, PokemonGeneration, PokemonType } from './types'
import type { PokechiState, UserPokemon } from '../state'
import type { Strings } from './i18n'

// A permanent power-up granted by completing a challenge. Most of them are
// XP multipliers that only apply while the active pokemon is revealed
// (level > 0) — the two exceptions carry appliesInPokeball explicitly:
// 'xp-always' works in any state and 'xp-pokeball' only inside the Pokeball.
export type ChallengePowerUpKind =
  | 'xp-type'
  | 'xp-shiny'
  | 'xp-always'
  | 'xp-pokeball'
  | 'force-shiny'

export interface ChallengePowerUp {
  kind: ChallengePowerUpKind
  xpMultiplier?: number
  elementType?: PokemonElementType
  appliesInPokeball?: boolean
}

export interface ChallengeConfig {
  id: string
  order: number
  name: string
  objective: string
  powerUpLabel: string
  powerUp: ChallengePowerUp
}

// Final evolutions of the four starter lines per type (Gen 1-4). A starter
// "line" counts as complete once its final stage is discovered.
const FIRE_STARTER_FINALS: PokemonType[] = ['charizard', 'typhlosion', 'blaziken', 'infernape']
const WATER_STARTER_FINALS: PokemonType[] = ['blastoise', 'feraligatr', 'swampert', 'empoleon']
const GRASS_STARTER_FINALS: PokemonType[] = ['venusaur', 'meganium', 'sceptile', 'torterra']

function xpType(elementType: PokemonElementType): ChallengePowerUp {
  return { kind: 'xp-type', xpMultiplier: 2, elementType }
}

export const CHALLENGES: ChallengeConfig[] = [
  {
    id: 'fire-master',
    order: 1,
    name: 'Maestro Fuego',
    objective: 'Completa las 4 líneas evolutivas de los iniciales de tipo fuego (Charizard, Typhlosion, Blaziken e Infernape).',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo fuego',
    powerUp: xpType(PokemonElementType.fire),
  },
  {
    id: 'water-master',
    order: 2,
    name: 'Maestro Agua',
    objective: 'Completa las 4 líneas evolutivas de los iniciales de tipo agua (Blastoise, Feraligatr, Swampert y Empoleon).',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo agua',
    powerUp: xpType(PokemonElementType.water),
  },
  {
    id: 'leaf-master',
    order: 3,
    name: 'Maestro Hoja',
    objective: 'Completa las 4 líneas evolutivas de los iniciales de tipo planta (Venusaur, Meganium, Sceptile y Torterra).',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo planta',
    powerUp: xpType(PokemonElementType.grass),
  },
  {
    id: 'classic-shiny',
    order: 4,
    name: 'Todo un Clásico',
    objective: 'Obtén un Gyarados shiny.',
    powerUpLabel: 'XP x2 si el pokémon activo es shiny',
    powerUp: { kind: 'xp-shiny', xpMultiplier: 2 },
  },
  {
    id: 'fighters',
    order: 5,
    name: 'Luchadores',
    objective: 'Obtén a Hitmonlee y a Hitmonchan.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo lucha',
    powerUp: xpType(PokemonElementType.fighting),
  },
  {
    id: 'headaches',
    order: 6,
    name: 'Dolores de Cabeza',
    objective: 'Obtén a Mewtwo.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo psíquico',
    powerUp: xpType(PokemonElementType.psychic),
  },
  {
    id: 'city-master',
    order: 7,
    name: 'Domina la Ciudad',
    objective: 'Completa todos los pokémon de cualquiera de las generaciones (solo se concede la primera vez que completas una generación).',
    powerUpLabel: 'XP x2 siempre, con cualquier pokémon y en cualquier estado',
    powerUp: { kind: 'xp-always', xpMultiplier: 2, appliesInPokeball: true },
  },
  {
    id: 'catch-em-all',
    order: 8,
    name: 'Atrápalos ya!',
    objective: 'Completa toda la Pokechidex (todos los pokémon de todas las generaciones).',
    powerUpLabel: 'Los próximos descubrimientos serán siempre shiny',
    powerUp: { kind: 'force-shiny' },
  },
  {
    id: 'brocks-heartbreak',
    order: 9,
    name: 'El Desamor de Brock',
    objective: 'Obtén a Onix, Steelix, Geodude y Sudowoodo.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo roca',
    powerUp: xpType(PokemonElementType.rock),
  },
  {
    id: 'rocket-motto',
    order: 10,
    name: 'Para Proteger al Mundo de la Devastación',
    objective: 'Obtén a Meowth, Arbok, Weezing y Seviper.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo veneno',
    powerUp: xpType(PokemonElementType.poison),
  },
  {
    id: 'joy-legacy',
    order: 11,
    name: 'El Legado de la Enfermera Joy',
    objective: 'Obtén a Togepi y a Chansey.',
    powerUpLabel: 'XP x2 mientras el pokémon esté en estado Pokeball',
    powerUp: { kind: 'xp-pokeball', xpMultiplier: 2, appliesInPokeball: true },
  },
  {
    id: 'electric-storm',
    order: 12,
    name: 'Tormenta Eléctrica',
    objective: 'Obtén a Pikachu, Electabuzz y Ampharos.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo eléctrico',
    powerUp: xpType(PokemonElementType.electric),
  },
  {
    id: 'dragon-sanctuary',
    order: 13,
    name: 'Santuario del Dragón',
    objective: 'Obtén a Dragonite, Salamence y Garchomp.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo dragón',
    powerUp: xpType(PokemonElementType.dragon),
  },
  {
    id: 'night-terror',
    order: 14,
    name: 'Terror nocturno',
    objective: 'Obtén a Gengar, Misdreavus y Sableye.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo fantasma',
    powerUp: xpType(PokemonElementType.ghost),
  },
  {
    id: 'outcast-club',
    order: 15,
    name: 'El Club de los Desechados',
    objective: 'Obtén a Rattata, Sentret, Zigzagoon y Bidoof.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo normal',
    powerUp: xpType(PokemonElementType.normal),
  },
  {
    id: 'forest-plague',
    order: 16,
    name: 'Plaga del Bosque',
    objective: 'Obtén a Butterfree, Scizor y Heracross.',
    powerUpLabel: 'XP x2 si el pokémon activo es de tipo bicho',
    powerUp: xpType(PokemonElementType.bug),
  },
]

export interface ChallengeDisplay {
  name: string
  objective: string
  powerUp: string
}

// Localized display text for a challenge. Falls back to the canonical
// Spanish catalogue text when a dictionary lacks the entry.
export function getChallengeDisplay(challengeId: string, strings: Strings): ChallengeDisplay {
  const fallback = CHALLENGES.find((c) => c.id === challengeId)
  return {
    name: strings.challengeNames[challengeId] ?? fallback?.name ?? challengeId,
    objective: strings.challengeObjectives[challengeId] ?? fallback?.objective ?? '',
    powerUp: strings.challengePowerUps[challengeId] ?? fallback?.powerUpLabel ?? '',
  }
}

function hasAllDiscovered(state: PokechiState, species: PokemonType[]): boolean {
  const discovered = new Set(state.pokedex)
  return species.every((s) => discovered.has(s))
}

function isGenerationComplete(state: PokechiState, generation: PokemonGeneration): boolean {
  const discovered = new Set(state.pokedex)
  for (const [type, data] of Object.entries(POKEMON_DATA)) {
    if (data.generation === generation && !discovered.has(type as PokemonType)) {
      return false
    }
  }
  return true
}

function isPokedexComplete(state: PokechiState): boolean {
  const discovered = new Set(state.pokedex)
  return Object.keys(POKEMON_DATA).every((type) => discovered.has(type as PokemonType))
}

export function isChallengeComplete(challengeId: string, state: PokechiState): boolean {
  switch (challengeId) {
    case 'fire-master':
      return hasAllDiscovered(state, FIRE_STARTER_FINALS)
    case 'water-master':
      return hasAllDiscovered(state, WATER_STARTER_FINALS)
    case 'leaf-master':
      return hasAllDiscovered(state, GRASS_STARTER_FINALS)
    case 'classic-shiny':
      return new Set(state.shinyPokedex).has('gyarados')
    case 'fighters':
      return hasAllDiscovered(state, ['hitmonlee', 'hitmonchan'])
    case 'headaches':
      return hasAllDiscovered(state, ['mewtwo'])
    case 'city-master':
      return (
        isGenerationComplete(state, PokemonGeneration.Gen1) ||
        isGenerationComplete(state, PokemonGeneration.Gen2) ||
        isGenerationComplete(state, PokemonGeneration.Gen3) ||
        isGenerationComplete(state, PokemonGeneration.Gen4)
      )
    case 'catch-em-all':
      return isPokedexComplete(state)
    case 'brocks-heartbreak':
      return hasAllDiscovered(state, ['onix', 'steelix', 'geodude', 'sudowoodo'])
    case 'rocket-motto':
      return hasAllDiscovered(state, ['meowth', 'arbok', 'weezing', 'seviper'])
    case 'joy-legacy':
      return hasAllDiscovered(state, ['togepi', 'chansey'])
    case 'electric-storm':
      return hasAllDiscovered(state, ['pikachu', 'electabuzz', 'ampharos'])
    case 'dragon-sanctuary':
      return hasAllDiscovered(state, ['dragonite', 'salamence', 'garchomp'])
    case 'night-terror':
      return hasAllDiscovered(state, ['gengar', 'misdreavus', 'sableye'])
    case 'outcast-club':
      return hasAllDiscovered(state, ['rattata', 'sentret', 'zigzagoon', 'bidoof'])
    case 'forest-plague':
      return hasAllDiscovered(state, ['butterfree', 'scizor', 'heracross'])
    default:
      return false
  }
}

// A power-up only counts while its condition holds on the CURRENT active
// pokemon. Type/shiny bonuses need a revealed pokemon (level > 0); the two
// Pokeball-aware bonuses ('xp-always', 'xp-pokeball') also work at level 0.
export function isPowerUpApplicable(challenge: ChallengeConfig, pokemon: UserPokemon | undefined): boolean {
  if (!pokemon) return false
  const kind = challenge.powerUp.kind
  if (kind === 'xp-always') return true
  if (kind === 'xp-pokeball') return pokemon.level === 0
  if (kind === 'force-shiny') return false
  if (pokemon.level === 0) return false
  if (kind === 'xp-shiny') return pokemon.color === PokemonColor.shiny
  if (kind === 'xp-type' && challenge.powerUp.elementType) {
    return (pokemon.types ?? []).includes(challenge.powerUp.elementType)
  }
  return false
}

// Every applicable x2 simply adds up (three applicable x2 bonuses grant x6).
// With nothing applicable the multiplier is x1.
export function getChallengeXPMultiplier(state: PokechiState): number {
  const earned = new Set(state.challenges ?? [])
  if (earned.size === 0) return 1
  let total = 0
  for (const challenge of CHALLENGES) {
    if (!earned.has(challenge.id)) continue
    if (!challenge.powerUp.xpMultiplier) continue
    if (!isPowerUpApplicable(challenge, state.pokemon)) continue
    total += challenge.powerUp.xpMultiplier
  }
  return total === 0 ? 1 : total
}

export function shouldForceShinyDiscovery(state: PokechiState): boolean {
  return (state.challenges ?? []).includes('catch-em-all')
}

export function getEarnedChallenges(state: PokechiState): ChallengeConfig[] {
  const earned = new Set(state.challenges ?? [])
  return CHALLENGES.filter((c) => earned.has(c.id)).sort((a, b) => a.order - b.order)
}

// Awards every newly completed challenge exactly once: records the id and
// gifts a Premier Ball on top of the permanent power-up.
export function refreshChallenges(state: PokechiState): ChallengeConfig[] {
  const earned = new Set(state.challenges ?? [])
  const newlyEarned: ChallengeConfig[] = []
  for (const challenge of CHALLENGES) {
    if (earned.has(challenge.id)) continue
    if (!isChallengeComplete(challenge.id, state)) continue
    if (!state.challenges) state.challenges = []
    state.challenges.push(challenge.id)
    earned.add(challenge.id)
    state.items['premier-ball'] = (state.items['premier-ball'] || 0) + 1
    newlyEarned.push(challenge)
  }
  return newlyEarned
}
