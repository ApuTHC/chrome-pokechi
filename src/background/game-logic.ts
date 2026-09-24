import {
  PokemonColor,
  PokemonElementType,
  PokemonGeneration,
  PokemonRarity,
  PokemonType,
} from '../common/types'
import {
  EvolutionLine,
  getRandomBasePokemon,
  getRandomPokemonColor,
  getEvolutionLine,
  getEvolutionLineContaining,
  getEvolutionLinesContaining,
  pickEvolutionLineForBase,
  repairEvolutionLine,
  resolveEvolutionLine,
  getPokemonByLevel,
  getPokemonLevel,
  hasFurtherEvolution,
  STARTER_POKEMON,
} from '../common/pokemon-evolutions'
import { POKEMON_DATA } from '../common/pokemon-data'
import { ItemId } from '../common/items'
import { BADGES, BadgeConfig, BadgeCondition } from '../common/badges'
import { Strings, getStrings } from '../common/i18n'
import {
  PokechiState,
  Roster,
  RosterEntry,
  UserPokemon,
} from '../types'

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

export function getPokemonId(pokemonType: PokemonType): number {
  const data = POKEMON_DATA[pokemonType]
  return data ? data.id : 0
}

export function getPokemonName(pokemonType: PokemonType): string {
  const data = POKEMON_DATA[pokemonType]
  return data ? data.name : pokemonType
}

export function getPokemonTypes(pokemonType: PokemonType): PokemonElementType[] {
  const data = POKEMON_DATA[pokemonType]
  return data ? data.types : []
}

function getEvolutionLineForSelection(
  pokemonType: PokemonType,
  roster: Roster
): EvolutionLine | undefined {
  const candidates = getEvolutionLinesContaining(pokemonType)
  if (candidates.length <= 1) {
    return candidates[0]
  }

  const raised =
    candidates.find((line) => roster[line.base]?.type === pokemonType) ??
    candidates.find((line) => roster[line.base] !== undefined)

  if (!raised) {
    return pickEvolutionLineForBase(pokemonType) ?? candidates[0]
  }

  const entry = roster[raised.base]
  return repairEvolutionLine(entry.evolutionLine ?? [raised.base], entry.type) ?? raised
}

export function isPokemonDiscovered(state: PokechiState, pokemonType: PokemonType): boolean {
  return state.pokedex.includes(pokemonType)
}

export function isPokemonShinyDiscovered(state: PokechiState, pokemonType: PokemonType): boolean {
  return state.shinyPokedex.includes(pokemonType)
}

export function discoverPokemon(
  state: PokechiState,
  pokemonType: PokemonType,
  color: PokemonColor
): void {
  if (!state.pokedex.includes(pokemonType)) {
    state.pokedex.push(pokemonType)
  }
  if (color === PokemonColor.shiny && !state.shinyPokedex.includes(pokemonType)) {
    state.shinyPokedex.push(pokemonType)
  }
}

export function rememberActivePokemon(state: PokechiState): void {
  const current = state.pokemon
  if (!current || current.level === 0 || !current.canGainXP) {
    return
  }
  const base = current.evolutionLine?.[0]
  if (!base) return
  state.roster[base] = {
    type: current.type,
    level: current.level,
    xp: current.xp,
    color: current.color,
    evolutionLine: current.evolutionLine as PokemonType[],
  }
}

export function buildPokemon(
  entry: RosterEntry,
  scaleFactor: number,
  canGainXP: boolean
): UserPokemon {
  return {
    id: getPokemonId(entry.type),
    type: entry.type,
    name: getPokemonName(entry.type),
    level: entry.level,
    xp: entry.xp,
    types: getPokemonTypes(entry.type),
    evolutionLine: entry.evolutionLine,
    state: 'idle',
    scale: scaleFactor,
    isTransitionIn: true,
    leftPosition: 0,
    direction: 'right',
    color: entry.color,
    canGainXP,
  }
}

export function buildFreshPokeball(
  state: PokechiState,
  basePokemon: PokemonType,
  forcedColor?: PokemonColor,
  ballSource?: 'master-ball' | 'premier-ball'
): UserPokemon {
  const scaleFactor = state.settings?.scaleFactor ?? 1.0
  const color = forcedColor ?? getRandomPokemonColor()
  const evolutionLine = pickEvolutionLineForBase(basePokemon)

  if (!evolutionLine) {
    throw new Error(`No evolution line found for ${basePokemon}`)
  }

  const evolutionLineArray = [basePokemon, ...evolutionLine.evolutions]
  const finalStage =
    evolutionLine.evolutions.length > 0
      ? evolutionLine.evolutions[evolutionLine.evolutions.length - 1]
      : evolutionLine.base

  const isAlreadyOwned =
    color === PokemonColor.shiny
      ? isPokemonShinyDiscovered(state, finalStage)
      : isPokemonDiscovered(state, finalStage)

  const pokemon: UserPokemon = {
    id: getPokemonId(basePokemon),
    type: basePokemon,
    name: getPokemonName(basePokemon),
    level: 0,
    xp: 0,
    types: getPokemonTypes(basePokemon),
    evolutionLine: evolutionLineArray,
    state: 'pokeball',
    scale: scaleFactor,
    isTransitionIn: true,
    leftPosition: 0,
    direction: 'right',
    color,
    canGainXP: true,
    pendingAlreadyOwned: isAlreadyOwned,
    pendingBallReveal: ballSource,
  }

  state.pokemon = pokemon
  return pokemon
}

export function createNewPokemon(state: PokechiState): UserPokemon {
  rememberActivePokemon(state)
  return buildFreshPokeball(state, getRandomBasePokemon())
}

export function createStarterPokemon(state: PokechiState): UserPokemon {
  rememberActivePokemon(state)
  const starter = STARTER_POKEMON[Math.floor(Math.random() * STARTER_POKEMON.length)]
  return buildFreshPokeball(state, starter)
}

export function canEvolve(pokemon: UserPokemon): boolean {
  const requiredXP = getRequiredXPForLevel(pokemon.level)
  if (pokemon.xp < requiredXP) {
    return false
  }
  const evolutionLine = resolveEvolutionLine(pokemon.evolutionLine as PokemonType[])
  if (!evolutionLine) {
    return false
  }
  return hasFurtherEvolution(evolutionLine, pokemon.level)
}

export function evolvePokemon(state: PokechiState, pokemon: UserPokemon): boolean {
  if (!canEvolve(pokemon)) {
    return false
  }

  const evolutionLine = resolveEvolutionLine(pokemon.evolutionLine as PokemonType[])
  if (!evolutionLine) {
    return false
  }

  const nextLevel = pokemon.level + 1
  const nextPokemon = getPokemonByLevel(evolutionLine, nextLevel)

  pokemon.id = getPokemonId(nextPokemon)
  pokemon.type = nextPokemon
  pokemon.name = getPokemonName(nextPokemon)
  pokemon.types = getPokemonTypes(nextPokemon)
  pokemon.level = nextLevel
  pokemon.xp = 0
  pokemon.state = nextLevel === 1 ? 'idle' : 'walking'
  pokemon.isTransitionIn = true

  if (nextLevel === 1) {
    state.hatchCount = (state.hatchCount || 0) + 1
    // Give Premier Ball every 10 hatches
    if (state.hatchCount % 10 === 0) {
      state.items['premier-ball'] = (state.items['premier-ball'] || 0) + 1
    }
  }

  if (nextLevel === 1 && pokemon.pendingAlreadyOwned) {
    pokemon.canGainXP = false
    pokemon.xp = getRequiredXPForLevel(nextLevel)
  }
  pokemon.pendingAlreadyOwned = false

  discoverPokemon(state, nextPokemon, pokemon.color)
  rememberActivePokemon(state)
  refreshBadges(state)

  return true
}

export function addXP(
  state: PokechiState,
  amount: number
): { evolved: boolean; pokemon?: UserPokemon } {
  state.totalXP = (state.totalXP || 0) + amount
  const pokemon = state.pokemon
  if (!pokemon || !pokemon.canGainXP) {
    return { evolved: false, pokemon }
  }

  pokemon.xp += amount
  pokemon.isTransitionIn = false

  if (canEvolve(pokemon)) {
    const evolved = evolvePokemon(state, pokemon)
    return { evolved, pokemon }
  }

  return { evolved: false, pokemon }
}

export function selectPokemonFromPokedex(
  state: PokechiState,
  pokemonType: PokemonType,
  requestedColor?: PokemonColor
): UserPokemon | undefined {
  const roster = state.roster
  const clickedLine = getEvolutionLineForSelection(pokemonType, roster)
  if (!clickedLine) {
    return undefined
  }

  rememberActivePokemon(state)
  const scaleFactor = state.settings?.scaleFactor ?? 1.0

  const storedEntry = roster[clickedLine.base]
  if (storedEntry && storedEntry.color === undefined) {
    storedEntry.color = PokemonColor.default
  }
  if (storedEntry && !storedEntry.evolutionLine) {
    storedEntry.evolutionLine = [clickedLine.base, ...clickedLine.evolutions] as PokemonType[]
  }

  let entry: RosterEntry
  let canGainXP: boolean

  if (!storedEntry) {
    entry = {
      type: pokemonType,
      level: getPokemonLevel(pokemonType, clickedLine),
      xp: 0,
      color: PokemonColor.default,
      evolutionLine: [clickedLine.base, ...clickedLine.evolutions] as PokemonType[],
    }
    canGainXP = true
  } else if (storedEntry.type === pokemonType) {
    entry = storedEntry
    canGainXP = true
  } else {
    const level = getPokemonLevel(pokemonType, clickedLine)
    entry = {
      type: pokemonType,
      level,
      xp: getRequiredXPForLevel(level),
      color: storedEntry.color,
      evolutionLine: [clickedLine.base, ...clickedLine.evolutions] as PokemonType[],
    }
    canGainXP = false
  }

  if (
    requestedColor === PokemonColor.shiny &&
    !isPokemonShinyDiscovered(state, pokemonType)
  ) {
    requestedColor = PokemonColor.default
  }
  if (requestedColor !== undefined) {
    entry.color = requestedColor
  }

  const pokemon = buildPokemon(entry, scaleFactor, canGainXP)
  state.pokemon = pokemon
  if (canGainXP) {
    roster[clickedLine.base] = entry
  }

  return pokemon
}

// Item functions
export function canUseRareCandy(pokemon: UserPokemon | undefined): boolean {
  if (!pokemon || pokemon.level === 0 || !pokemon.canGainXP) {
    return false
  }
  const evolutionLine = resolveEvolutionLine(pokemon.evolutionLine as PokemonType[])
  return evolutionLine ? hasFurtherEvolution(evolutionLine, pokemon.level) : false
}

export function useRareCandy(state: PokechiState): boolean {
  const pokemon = state.pokemon
  if (!pokemon || (state.items['rare-candy'] || 0) <= 0 || !canUseRareCandy(pokemon)) {
    return false
  }

  pokemon.xp = getRequiredXPForLevel(pokemon.level)
  const evolved = evolvePokemon(state, pokemon)
  if (!evolved) {
    return false
  }

  state.items['rare-candy'] -= 1
  state.itemUsageCount['rare-candy'] = (state.itemUsageCount['rare-candy'] || 0) + 1
  refreshBadges(state)
  return true
}

const MASTER_BALL_TIER_ODDS: Array<[PokemonRarity, number]> = [
  [PokemonRarity.subLegendary, 0.6],
  [PokemonRarity.legendary, 0.3],
  [PokemonRarity.mythical, 0.1],
]

function rollMasterBallTier(): PokemonRarity {
  let roll = Math.random()
  for (const [rarity, weight] of MASTER_BALL_TIER_ODDS) {
    if (roll < weight) {
      return rarity
    }
    roll -= weight
  }
  return PokemonRarity.mythical
}

function pickMasterBallReward(state: PokechiState): PokemonType | undefined {
  const discovered = new Set(state.pokedex)
  const allTiers = MASTER_BALL_TIER_ODDS.map(([rarity]) => rarity)
  const rolledTier = rollMasterBallTier()
  const orderedTiers = [rolledTier, ...allTiers.filter((tier) => tier !== rolledTier)]

  for (const tier of orderedTiers) {
    const candidates = Object.entries(POKEMON_DATA)
      .filter(([type, data]) => data.rarity === tier && !discovered.has(type as PokemonType))
      .map(([type]) => type as PokemonType)
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)]
    }
  }
  return undefined
}

export function useMasterBall(
  state: PokechiState
): { pokemon: UserPokemon; revealedType: PokemonType; isShiny: boolean } | undefined {
  if ((state.items['master-ball'] || 0) <= 0) {
    return undefined
  }
  const reward = pickMasterBallReward(state)
  if (!reward) {
    return undefined
  }

  const color = getRandomPokemonColor()
  const base = getEvolutionLineContaining(reward)?.base ?? reward
  rememberActivePokemon(state)
  const pokemon = buildFreshPokeball(state, base, color, 'master-ball')
  state.items['master-ball'] -= 1
  state.itemUsageCount['master-ball'] = (state.itemUsageCount['master-ball'] || 0) + 1
  return { pokemon, revealedType: reward, isShiny: color === PokemonColor.shiny }
}

function pickPremierBallReward(state: PokechiState): PokemonType | undefined {
  const shinyDiscovered = new Set(state.shinyPokedex)
  const candidates = Object.keys(POKEMON_DATA).filter(
    (type) => !shinyDiscovered.has(type as PokemonType)
  ) as PokemonType[]
  if (candidates.length === 0) {
    return undefined
  }
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function usePremierBall(
  state: PokechiState
): { pokemon: UserPokemon; revealedType: PokemonType } | undefined {
  if ((state.items['premier-ball'] || 0) <= 0) {
    return undefined
  }
  const reward = pickPremierBallReward(state)
  if (!reward) {
    return undefined
  }

  const base = getEvolutionLineContaining(reward)?.base ?? reward
  rememberActivePokemon(state)
  const pokemon = buildFreshPokeball(state, base, PokemonColor.shiny, 'premier-ball')
  state.items['premier-ball'] -= 1
  state.itemUsageCount['premier-ball'] = (state.itemUsageCount['premier-ball'] || 0) + 1
  return { pokemon, revealedType: reward }
}

// Badges
export interface BadgeGenerationProgress {
  discovered: number
  total: number
  shinyDiscovered: number
  fossilDiscovered: number
  subLegendaryDiscovered: number
  legendaryDiscovered: number
  mythicalDiscovered: number
}

export interface BadgeRequirementStatus {
  label: string
  current: number
  required: number
  met: boolean
}

export interface BadgeStatus {
  badge: BadgeConfig
  earned: boolean
  requirements: BadgeRequirementStatus[]
}

function getGenerationProgress(state: PokechiState): Record<number, BadgeGenerationProgress> {
  const discovered = new Set(state.pokedex)
  const shinyDiscovered = new Set(state.shinyPokedex)

  const progress: Record<number, BadgeGenerationProgress> = {}
  for (const gen of [
    PokemonGeneration.Gen1,
    PokemonGeneration.Gen2,
    PokemonGeneration.Gen3,
    PokemonGeneration.Gen4,
  ]) {
    progress[gen] = {
      discovered: 0,
      total: 0,
      shinyDiscovered: 0,
      fossilDiscovered: 0,
      subLegendaryDiscovered: 0,
      legendaryDiscovered: 0,
      mythicalDiscovered: 0,
    }
  }

  for (const [type, data] of Object.entries(POKEMON_DATA)) {
    const genProgress = progress[data.generation]
    if (!genProgress) continue

    genProgress.total++
    if (discovered.has(type as PokemonType)) {
      genProgress.discovered++
      if (data.rarity === PokemonRarity.fossil) genProgress.fossilDiscovered++
      else if (data.rarity === PokemonRarity.subLegendary) genProgress.subLegendaryDiscovered++
      else if (data.rarity === PokemonRarity.legendary) genProgress.legendaryDiscovered++
      else if (data.rarity === PokemonRarity.mythical) genProgress.mythicalDiscovered++
    }
    if (shinyDiscovered.has(type as PokemonType)) {
      genProgress.shinyDiscovered++
    }
  }

  return progress
}

function evaluateBadgeCondition(
  condition: BadgeCondition,
  progress: BadgeGenerationProgress,
  rareCandyUsed: number,
  strings: Strings
): BadgeRequirementStatus[] {
  const requirements: BadgeRequirementStatus[] = []
  const push = (label: string, current: number, required: number | undefined) => {
    if (required === undefined) return
    requirements.push({ label, current, required, met: current >= required })
  }

  push(strings.requirementSpeciesDiscovered, progress.discovered, condition.minDiscovered)
  push(strings.requirementShinyDiscovered, progress.shinyDiscovered, condition.minShinyDiscovered)
  push(strings.requirementFossilsDiscovered, progress.fossilDiscovered, condition.minFossilDiscovered)
  push(
    strings.requirementSubLegendariesDiscovered,
    progress.subLegendaryDiscovered,
    condition.minSubLegendaryDiscovered
  )
  push(
    strings.requirementLegendariesDiscovered,
    progress.legendaryDiscovered,
    condition.minLegendaryDiscovered
  )
  push(strings.requirementMythicalsDiscovered, progress.mythicalDiscovered, condition.minMythicalDiscovered)
  push(strings.requirementRareCandiesUsed, rareCandyUsed, condition.minRareCandyUsed)

  return requirements
}

export function getBadgeStatuses(
  state: PokechiState,
  strings: Strings = getStrings(state.settings?.language || 'en')
): BadgeStatus[] {
  const progressByGen = getGenerationProgress(state)
  const earnedIds = new Set(state.badges)
  const rareCandyUsed = state.itemUsageCount['rare-candy'] || 0

  return BADGES.map((badge) => {
    const progress = progressByGen[badge.generation]
    const requirements = evaluateBadgeCondition(badge.condition, progress, rareCandyUsed, strings)
    return {
      badge,
      earned: earnedIds.has(badge.id),
      requirements,
    }
  })
}

export function refreshBadges(state: PokechiState): BadgeConfig[] {
  const earned = new Set(state.badges)
  const statuses = getBadgeStatuses(state)
  const newlyEarned: BadgeConfig[] = []

  for (const status of statuses) {
    if (!earned.has(status.badge.id) && status.requirements.every((r) => r.met)) {
      state.badges.push(status.badge.id)
      earned.add(status.badge.id)
      newlyEarned.push(status.badge)
    }
  }

  return newlyEarned
}
