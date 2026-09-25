import { describe, expect, it } from 'vitest'
import {
  CHALLENGES,
  getChallengeXPMultiplier,
  getEarnedChallenges,
  isChallengeComplete,
  isPowerUpApplicable,
  refreshChallenges,
  shouldForceShinyDiscovery,
} from './challenges'
import { POKEMON_DATA } from './pokemon-data'
import { PokemonColor, PokemonElementType, PokemonGeneration, PokemonType } from './types'
import type { PokechiState, UserPokemon } from '../state'

function makeState(overrides: Partial<PokechiState> = {}): PokechiState {
  return {
    schemaVersion: 1,
    pokedex: [],
    shinyPokedex: [],
    roster: {},
    totalXP: 0,
    hatchCount: 0,
    items: {},
    itemUsageCount: {},
    badges: [],
    challenges: [],
    settings: {
      scaleFactor: 1,
      soundEnabled: true,
      petVisible: true,
      customNewTab: true,
      language: 'en',
    },
    ...overrides,
  }
}

function makePokemon(overrides: Partial<UserPokemon> = {}): UserPokemon {
  return {
    id: 1,
    type: 'charmander',
    name: 'Charmander',
    level: 1,
    xp: 0,
    types: [PokemonElementType.fire],
    evolutionLine: ['charmander', 'charmeleon', 'charizard'],
    state: 'idle',
    scale: 1,
    isTransitionIn: false,
    color: PokemonColor.default,
    canGainXP: true,
    ...overrides,
  }
}

describe('challenge catalogue', () => {
  it('ships the 16 specified challenges in order', () => {
    expect(CHALLENGES).toHaveLength(16)
    expect(CHALLENGES.map((c) => c.id)).toEqual([
      'fire-master',
      'water-master',
      'leaf-master',
      'classic-shiny',
      'fighters',
      'headaches',
      'city-master',
      'catch-em-all',
      'brocks-heartbreak',
      'rocket-motto',
      'joy-legacy',
      'electric-storm',
      'dragon-sanctuary',
      'night-terror',
      'outcast-club',
      'forest-plague',
    ])
  })
})

describe('isChallengeComplete', () => {
  it('completes Maestro Fuego only with the 4 fire starter finals', () => {
    const partial = makeState({ pokedex: ['charizard', 'typhlosion', 'blaziken'] })
    expect(isChallengeComplete('fire-master', partial)).toBe(false)
    const full = makeState({ pokedex: ['charizard', 'typhlosion', 'blaziken', 'infernape'] })
    expect(isChallengeComplete('fire-master', full)).toBe(true)
  })

  it('requires a shiny Gyarados for Todo un Clásico', () => {
    expect(isChallengeComplete('classic-shiny', makeState({ pokedex: ['gyarados'] }))).toBe(false)
    expect(isChallengeComplete('classic-shiny', makeState({ shinyPokedex: ['gyarados'] }))).toBe(true)
  })

  it('completes Domina la Ciudad with any single finished generation', () => {
    const gen1 = Object.keys(POKEMON_DATA).filter(
      (t) => POKEMON_DATA[t]?.generation === PokemonGeneration.Gen1
    ) as PokemonType[]
    expect(gen1.length).toBeGreaterThan(0)
    expect(isChallengeComplete('city-master', makeState({ pokedex: gen1 }))).toBe(true)
    expect(isChallengeComplete('city-master', makeState({ pokedex: gen1.slice(0, -1) }))).toBe(false)
  })

  it('completes Atrápalos ya! only with the full dex', () => {
    const all = Object.keys(POKEMON_DATA) as PokemonType[]
    expect(isChallengeComplete('catch-em-all', makeState({ pokedex: all }))).toBe(true)
    expect(isChallengeComplete('catch-em-all', makeState({ pokedex: all.slice(0, -1) }))).toBe(false)
  })
})

describe('refreshChallenges', () => {
  it('awards the challenge once plus a Premier Ball, never twice', () => {
    const state = makeState({ pokedex: ['hitmonlee', 'hitmonchan'] })
    const first = refreshChallenges(state)
    expect(first.map((c) => c.id)).toEqual(['fighters'])
    expect(state.challenges).toContain('fighters')
    expect(state.items['premier-ball']).toBe(1)
    expect(refreshChallenges(state)).toHaveLength(0)
    expect(state.items['premier-ball']).toBe(1)
  })
})

describe('getChallengeXPMultiplier', () => {
  it('is x1 with no earned challenges', () => {
    const state = makeState({ pokemon: makePokemon() })
    expect(getChallengeXPMultiplier(state)).toBe(1)
  })

  it('applies the fire bonus only to revealed fire pokemon', () => {
    const state = makeState({
      challenges: ['fire-master'],
      pokemon: makePokemon({ types: [PokemonElementType.fire], level: 1 }),
    })
    expect(getChallengeXPMultiplier(state)).toBe(2)
    state.pokemon = makePokemon({ types: [PokemonElementType.water], level: 1 })
    expect(getChallengeXPMultiplier(state)).toBe(1)
    // Still a Pokeball: type bonuses need a revealed pokemon.
    state.pokemon = makePokemon({ types: [PokemonElementType.fire], level: 0 })
    expect(getChallengeXPMultiplier(state)).toBe(1)
  })

  it('sums applicable bonuses (three x2 grant x6)', () => {
    const state = makeState({
      challenges: ['fire-master', 'classic-shiny', 'city-master'],
      pokemon: makePokemon({ types: [PokemonElementType.fire], level: 2, color: PokemonColor.shiny }),
    })
    expect(getChallengeXPMultiplier(state)).toBe(6)
  })

  it('applies the Joy bonus only inside the Pokeball', () => {
    const state = makeState({
      challenges: ['joy-legacy'],
      pokemon: makePokemon({ level: 0 }),
    })
    expect(getChallengeXPMultiplier(state)).toBe(2)
    state.pokemon = makePokemon({ level: 1 })
    expect(getChallengeXPMultiplier(state)).toBe(1)
  })

  it('applies Domina la Ciudad in any state', () => {
    const egg = makeState({ challenges: ['city-master'], pokemon: makePokemon({ level: 0 }) })
    const revealed = makeState({
      challenges: ['city-master'],
      pokemon: makePokemon({ level: 2, types: [PokemonElementType.water] }),
    })
    expect(getChallengeXPMultiplier(egg)).toBe(2)
    expect(getChallengeXPMultiplier(revealed)).toBe(2)
  })
})

describe('shouldForceShinyDiscovery', () => {
  it('forces shiny only after Atrápalos ya!', () => {
    expect(shouldForceShinyDiscovery(makeState())).toBe(false)
    expect(shouldForceShinyDiscovery(makeState({ challenges: ['catch-em-all'] }))).toBe(true)
  })
})

describe('getEarnedChallenges', () => {
  it('returns earned challenges in catalogue order', () => {
    const state = makeState({ challenges: ['fighters', 'fire-master'] })
    expect(getEarnedChallenges(state).map((c) => c.id)).toEqual(['fire-master', 'fighters'])
  })
})

describe('isPowerUpApplicable', () => {
  it('never applies the shiny-forcing bonus as an XP multiplier', () => {
    const challenge = CHALLENGES.find((c) => c.id === 'catch-em-all')!
    const state = makeState({ challenges: ['catch-em-all'], pokemon: makePokemon({ level: 3 }) })
    expect(isPowerUpApplicable(challenge, state.pokemon)).toBe(false)
    expect(getChallengeXPMultiplier(state)).toBe(1)
  })
})
