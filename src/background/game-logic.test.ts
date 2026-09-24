import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addXP,
  evolvePokemon,
  refreshBadges,
  selectPokemonFromPokedex,
  useRareCandy,
} from './game-logic'
import { getRequiredXPForLevel } from '../common/xp'
import { POKEMON_DATA } from '../common/pokemon-data'
import { PokemonColor, PokemonGeneration, PokemonType } from '../common/types'
import type { PokechiState, UserPokemon } from '../state'

// V2: pure-logic tests for the XP/evolution/items/badges core. No chrome.*
// APIs are reachable from this module, so the suite runs in plain Node.

const BULBASAUR_LINE: PokemonType[] = ['bulbasaur', 'ivysaur', 'venusaur']

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
    type: 'bulbasaur',
    name: 'Bulbasaur',
    level: 0,
    xp: 0,
    types: [],
    evolutionLine: BULBASAUR_LINE,
    state: 'idle',
    scale: 1,
    isTransitionIn: false,
    color: PokemonColor.default,
    canGainXP: true,
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addXP', () => {
  it('accumulates XP on the pokemon and in totalXP without evolving below the threshold', () => {
    const state = makeState({ pokemon: makePokemon() })

    const result = addXP(state, 499)

    expect(result.evolved).toBe(false)
    expect(state.pokemon?.xp).toBe(499)
    expect(state.totalXP).toBe(499)
    expect(state.pokemon?.level).toBe(0)
  })

  it('hatches the Pokeball into level 1 exactly at the threshold', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // no hatch drops
    const state = makeState({ pokemon: makePokemon() })

    const result = addXP(state, 500)

    expect(result.evolved).toBe(true)
    // Level 1 is the line's BASE form (0 = Pokeball, 1 = base, 2/3 = stages).
    expect(state.pokemon?.level).toBe(1)
    expect(state.pokemon?.type).toBe('bulbasaur')
    expect(state.pokemon?.xp).toBe(0)
    expect(state.pokemon?.state).toBe('idle')
    expect(state.hatchCount).toBe(1)
    expect(state.pokedex).toContain('bulbasaur')
    expect(state.totalXP).toBe(500)
  })

  it('never credits XP to a frozen (already-owned line) pokemon but keeps totalXP', () => {
    const state = makeState({
      pokemon: makePokemon({ canGainXP: false, level: 1, xp: getRequiredXPForLevel(1) }),
    })

    const result = addXP(state, 50)

    expect(result.evolved).toBe(false)
    expect(state.pokemon?.xp).toBe(getRequiredXPForLevel(1))
    expect(state.totalXP).toBe(50)
  })

  it('reports evolved:false when there is no active pokemon', () => {
    const state = makeState()
    const result = addXP(state, 10)
    expect(result.evolved).toBe(false)
    expect(state.totalXP).toBe(10)
  })
})

describe('evolvePokemon', () => {
  it('refuses to evolve below the level threshold', () => {
    const state = makeState({ pokemon: makePokemon({ xp: 499 }) })

    expect(evolvePokemon(state, state.pokemon!)).toBe(false)
    expect(state.pokemon?.level).toBe(0)
    expect(state.hatchCount).toBe(0)
  })

  it('rolls the documented hatch drops independently (L7)', () => {
    // 0.01 < 0.02 â‰¤ 0.04 â†’ both rare-candy and master-ball drop.
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const state = makeState({ pokemon: makePokemon({ xp: 500 }) })

    expect(evolvePokemon(state, state.pokemon!)).toBe(true)
    expect(state.items['rare-candy']).toBe(1)
    expect(state.items['master-ball']).toBe(1)
  })

  it('drops only the rare candy when the roll sits between the two odds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.03) // â‰¥0.02 (master), <0.04 (candy)
    const state = makeState({ pokemon: makePokemon({ xp: 500 }) })

    expect(evolvePokemon(state, state.pokemon!)).toBe(true)
    expect(state.items['rare-candy']).toBe(1)
    expect(state.items['master-ball']).toBeUndefined()
  })

  it('drops nothing when the roll misses every chance', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const state = makeState({ pokemon: makePokemon({ xp: 500 }) })

    expect(evolvePokemon(state, state.pokemon!)).toBe(true)
    expect(state.items['rare-candy']).toBeUndefined()
    expect(state.items['master-ball']).toBeUndefined()
    expect(state.items['premier-ball']).toBeUndefined()
  })

  it('awards a Premier Ball on every 10th hatch (flat milestone)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // no probabilistic drops
    const state = makeState({ pokemon: makePokemon() })

    for (let hatch = 1; hatch <= 10; hatch++) {
      const pokemon = state.pokemon!
      pokemon.level = 0
      pokemon.xp = getRequiredXPForLevel(0)
      expect(evolvePokemon(state, pokemon)).toBe(true)
      expect(state.hatchCount).toBe(hatch)
      if (hatch < 10) {
        expect(state.items['premier-ball']).toBeUndefined()
      }
    }

    expect(state.items['premier-ball']).toBe(1)
  })

  it('freezes a hatch of an already-owned line: no XP gain, dex still updated', () => {
    const state = makeState({
      pokemon: makePokemon({ pendingAlreadyOwned: true, xp: 500 }),
      pokedex: ['ivysaur', 'venusaur'],
    })

    expect(evolvePokemon(state, state.pokemon!)).toBe(true)
    expect(state.pokemon?.level).toBe(1)
    expect(state.pokemon?.canGainXP).toBe(false)
    expect(state.pokemon?.xp).toBe(getRequiredXPForLevel(1))
    expect(state.pokemon?.pendingAlreadyOwned).toBe(false)

    // Further XP is refused at the pokemon level (totalXP still counts)â€¦
    const after = addXP(state, 60)
    expect(after.evolved).toBe(false)
    expect(state.pokemon?.xp).toBe(getRequiredXPForLevel(1))
    expect(state.totalXP).toBe(60)
    // â€¦and a dex entry discovered twice stays a single entry.
    expect(state.pokedex.filter((t) => t === 'ivysaur')).toHaveLength(1)
  })
})

describe('useRareCandy', () => {
  it('does nothing without candy in the bag', () => {
    const state = makeState({ pokemon: makePokemon({ xp: 100 }) })

    expect(useRareCandy(state)).toBe(false)
    expect(state.pokemon?.xp).toBe(100)
    expect(state.items['rare-candy']).toBeUndefined()
    expect(state.itemUsageCount['rare-candy']).toBeUndefined()
  })

  it('consumes one candy and evolves the active pokemon', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // no hatch drops
    const state = makeState({
      // A candy needs an active (hatched) pokemon — a level 0 Pokeball
      // is explicitly not usable.
      pokemon: makePokemon({ level: 1, type: 'bulbasaur' }),
      items: { 'rare-candy': 2 },
    })

    expect(useRareCandy(state)).toBe(true)
    expect(state.items['rare-candy']).toBe(1)
    expect(state.itemUsageCount['rare-candy']).toBe(1)
    expect(state.pokemon?.level).toBe(2)
    expect(state.pokemon?.type).toBe('ivysaur')
    expect(state.pokemon?.xp).toBe(0)
  })

  it('refuses on a fully evolved pokemon and keeps the candy', () => {
    const state = makeState({
      // Level 3 = final stage of the Bulbasaur line.
      pokemon: makePokemon({ type: 'venusaur', level: 3, xp: 0 }),
      items: { 'rare-candy': 1 },
    })

    expect(useRareCandy(state)).toBe(false)
    expect(state.items['rare-candy']).toBe(1)
    expect(state.itemUsageCount['rare-candy']).toBeUndefined()
  })
})

describe('selectPokemonFromPokedex', () => {
  it('freezes a later stage of an already-owned line (read-only)', () => {
    const state = makeState({
      roster: {
        bulbasaur: {
          type: 'ivysaur',
          level: 1,
          xp: 100,
          color: PokemonColor.default,
          evolutionLine: BULBASAUR_LINE,
        },
      },
      pokedex: ['bulbasaur', 'ivysaur', 'venusaur'],
    })

    const picked = selectPokemonFromPokedex(state, 'venusaur')

    expect(picked?.canGainXP).toBe(false)
    // venusaur is level 3 of the line: a frozen pick is parked at that
    // level's threshold (full bar, but canGainXP keeps it read-only).
    expect(picked?.xp).toBe(getRequiredXPForLevel(3))
    // The stored roster entry is not overwritten by a frozen pick.
    expect(state.roster['bulbasaur']?.type).toBe('ivysaur')
    expect(state.roster['bulbasaur']?.xp).toBe(100)
  })

  it('keeps the stored stage trainable when it is picked back', () => {
    const state = makeState({
      roster: {
        bulbasaur: {
          type: 'ivysaur',
          level: 1,
          xp: 100,
          color: PokemonColor.default,
          evolutionLine: BULBASAUR_LINE,
        },
      },
      pokedex: ['bulbasaur', 'ivysaur', 'venusaur'],
    })

    const picked = selectPokemonFromPokedex(state, 'ivysaur')

    expect(picked?.canGainXP).toBe(true)
    expect(state.roster['bulbasaur']?.type).toBe('ivysaur')
  })
})

describe('refreshBadges', () => {
  it('earns a badge once its requirements are met and never re-awards it', () => {
    // gen1-badge-1 (Boulder) needs 10 discovered Gen 1 species.
    const gen1 = Object.entries(POKEMON_DATA)
      .filter(([, data]) => data.generation === PokemonGeneration.Gen1)
      .slice(0, 10)
      .map(([type]) => type as PokemonType)
    expect(gen1).toHaveLength(10)
    const state = makeState({ pokedex: gen1 })

    const newlyEarned = refreshBadges(state)

    expect(newlyEarned.map((b) => b.id)).toContain('gen1-badge-1')
    expect(state.badges).toContain('gen1-badge-1')

    // A second pass with the same state awards nothing new.
    expect(refreshBadges(state)).toHaveLength(0)
    expect(state.badges.filter((id) => id === 'gen1-badge-1')).toHaveLength(1)
  })

  it('awards nothing while the requirements are still unmet', () => {
    const state = makeState({ pokedex: ['bulbasaur'] })

    expect(refreshBadges(state)).toHaveLength(0)
    expect(state.badges).toHaveLength(0)
  })
})
