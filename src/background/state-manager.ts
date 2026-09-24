import { PokechiState, UserPokemon, PokechiSettings, XPReason } from '../state'
import { BADGES, BadgeConfig } from '../common/badges'
import {
  createStarterPokemon,
  createNewPokemon,
  addXP as gameAddXP,
  selectPokemonFromPokedex,
  useRareCandy as gameUseRareCandy,
  useMasterBall as gameUseMasterBall,
  usePremierBall as gameUsePremierBall,
  refreshBadges,
} from './game-logic'
import { POKEMON_DATA } from '../common/pokemon-data'
import { getEvolutionLineContaining, pickEvolutionLineForBase } from '../common/pokemon-evolutions'
import { PokemonColor, PokemonType } from '../common/types'
import { POKECHI_STATE_KEY } from '../common/state-sync'
import { dispatchXPEvent, dispatchItemRevealEvent } from './pet-tabs'

// R5: XP events are coalesced in a ~700 ms leading+trailing window so a
// fast typist doesn't generate a burst of messages to every open tab.
const XP_EVENT_WINDOW_MS = 700

// L6: version of the stored state shape. Every save carries it from now
// on; anything stored without it counts as version 0. When the shape of
// PokechiState changes, bump CURRENT_SCHEMA and register a migration
// keyed by the version it upgrades TO (from TO - 1) — init() applies them
// in order, before repairPokemon, so field-level repairs always see the
// new shape.
const CURRENT_SCHEMA = 1
const MIGRATIONS: { [toVersion: number]: (state: PokechiState) => void } = {
  // v0 → v1 only stamps the version: v0 states are the pre-versioning
  // shape, which already matches PokechiState field-for-field (repairPokemon
  // backfills anything a very old save is missing).
}

// States stored by older versions may lack fields newer code renders or
// reads (types, name, id, evolutionLine, ...) — repair them in place so the
// floating-pet bar, the popup, and actions like spawning never hit undefined.
function repairPokemon(pokemon: UserPokemon | undefined): void {
  if (!pokemon) return
  const data = POKEMON_DATA[pokemon.type as PokemonType]
  if (!data) return
  if (!pokemon.name) pokemon.name = data.name
  if (!pokemon.id) pokemon.id = data.id
  if (!pokemon.types || pokemon.types.length === 0) {
    pokemon.types = [...data.types]
  }
  if (!pokemon.evolutionLine || pokemon.evolutionLine.length === 0) {
    const line =
      getEvolutionLineContaining(pokemon.type as PokemonType) ??
      pickEvolutionLineForBase(pokemon.type as PokemonType)
    if (line) {
      pokemon.evolutionLine = [line.base, ...line.evolutions] as PokemonType[]
    }
  }
  if (pokemon.color === undefined) pokemon.color = PokemonColor.default
  if (pokemon.canGainXP === undefined) pokemon.canGainXP = true
  if (pokemon.scale === undefined) pokemon.scale = 1.0
  if (!pokemon.direction) pokemon.direction = 'right'
  if (!pokemon.state) pokemon.state = pokemon.level === 0 ? 'pokeball' : 'walking'
}

export function createDefaultState(): PokechiState {
  const settings: PokechiSettings = {
    scaleFactor: 1.0,
    soundEnabled: true,
    petVisible: true,
    customNewTab: true,
    language: 'en',
  }

  const state: PokechiState = {
    schemaVersion: CURRENT_SCHEMA,
    pokemon: undefined,
    pokedex: [],
    shinyPokedex: [],
    roster: {},
    totalXP: 0,
    hatchCount: 0,
    items: {
      'rare-candy': 1, // Starter gift
    },
    itemUsageCount: {},
    badges: [],
    settings,
  }

  createStarterPokemon(state)
  return state
}

export class StateManager {
  private static instance: StateManager
  // L4: createDefaultState() runs exactly once, inside init() below (it also
  // spawns the starter Pokémon, so the field initializer duplicated that work
  // on every getInstance()). Callers must await init() before getState().
  private state!: PokechiState
  private isLoaded = false
  // Concurrent init() callers (the boot IIFE and onInstalled) share a single
  // run — without this both pass the isLoaded check, createDefaultState()
  // runs twice and two different random starters race to be persisted.
  private initPromise?: Promise<PokechiState>
  private saveTimeout?: ReturnType<typeof setTimeout>

  private constructor() {}

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager()
    }
    return StateManager.instance
  }

  public init(): Promise<PokechiState> {
    if (this.isLoaded) {
      return Promise.resolve(this.state)
    }
    if (!this.initPromise) {
      this.initPromise = this.loadState().finally(() => {
        // Only relevant when loading failed: lets a later call retry.
        this.initPromise = undefined
      })
    }
    return this.initPromise
  }

  private async loadState(): Promise<PokechiState> {
    // L4: a single default state per init — createDefaultState() also spawns
    // the starter Pokémon, so calling it repeatedly was wasted work.
    const defaults = createDefaultState()
    try {
      const result = await chrome.storage.local.get([POKECHI_STATE_KEY])
      if (result && result[POKECHI_STATE_KEY]) {
        const stored = result[POKECHI_STATE_KEY] as Partial<PokechiState>
        this.state = {
          ...defaults,
          ...stored,
          settings: {
            ...defaults.settings,
            ...(stored.settings || {}),
          },
          items: stored.items || {},
          itemUsageCount: stored.itemUsageCount || {},
          pokedex: stored.pokedex || [],
          shinyPokedex: stored.shinyPokedex || [],
          roster: stored.roster || {},
          badges: stored.badges || [],
        }

        // L6: run the migrations for whatever version was stored (missing
        // = v0, i.e. any save written before schemaVersion existed), then
        // stamp the current one. Nothing is dropped: the merge above kept
        // every stored field and migrations only reshape forward.
        const storedVersion = typeof stored.schemaVersion === 'number' ? stored.schemaVersion : 0
        for (let toVersion = storedVersion + 1; toVersion <= CURRENT_SCHEMA; toVersion++) {
          const migrate = MIGRATIONS[toVersion]
          if (migrate) migrate(this.state)
        }
        this.state.schemaVersion = CURRENT_SCHEMA

        if (!this.state.pokemon) {
          createStarterPokemon(this.state)
        }
        repairPokemon(this.state.pokemon)
      } else {
        this.state = defaults
        await this.saveDirect()
      }
    } catch (e) {
      console.error('Pokechi: error loading state from chrome.storage', e)
      this.state = defaults
    }

    this.isLoaded = true
    refreshBadges(this.state)
    return this.state
  }

  public getState(): PokechiState {
    return this.state
  }

  // Debounced save for XP bursts (typing flushes, tab events): coalesces
  // rapid mutations into one write without losing them.
  public save(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = undefined
      this.saveDirect()
    }, 400)
  }

  // L2: message handlers call this before sendResponse so a response of
  // "state was mutated" is never sent while the debounced write is still
  // pending (closing the browser right after must not lose the XP).
  public async flushPendingSave(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = undefined
      await this.saveDirect()
    }
  }

  public async saveDirect(): Promise<void> {
    try {
      // R5: no broadcast here — every consumer re-renders from
      // chrome.storage.onChanged on this same key.
      await chrome.storage.local.set({ [POKECHI_STATE_KEY]: this.state })
    } catch (e) {
      console.error('Pokechi: error saving state', e)
    }
  }

  // Coalesced transient XP event channel (leading + trailing edge).
  private xpWindowOpen = false
  private xpTimer?: ReturnType<typeof setTimeout>
  private pendingXp = {
    xpEarned: 0,
    reason: '',
    evolved: false,
    reasons: new Set<string>(),
    earnedBadges: [] as BadgeConfig[],
  }

  // L11: game-logic refreshes badges inside its own mutations (evolve /
  // rare candy), so diff state.badges around each call to learn which ids
  // are new and stage them for the next coalesced XP event.
  private noteEarnedBadges(before: string[]): void {
    if (this.state.badges.length <= before.length) return
    const beforeSet = new Set(before)
    for (const id of this.state.badges) {
      if (beforeSet.has(id)) continue
      const badge = BADGES.find((b) => b.id === id)
      if (badge) this.pendingXp.earnedBadges.push(badge)
    }
  }

  private emitXPEvent(
    amount: number,
    reason: string,
    evolved: boolean
  ): void {
    const p = this.pendingXp
    p.xpEarned += amount
    p.evolved = p.evolved || evolved
    if (reason) p.reasons.add(reason)

    if (!this.xpWindowOpen) {
      // Leading edge: send immediately, then hold the window open.
      this.xpWindowOpen = true
      this.dispatchPendingXP()
      this.xpTimer = setTimeout(() => {
        this.xpWindowOpen = false
        // Trailing edge: flush whatever accumulated during the window.
        if (this.pendingXp.xpEarned > 0 || this.pendingXp.evolved || this.pendingXp.earnedBadges.length > 0) {
          this.dispatchPendingXP()
        }
      }, XP_EVENT_WINDOW_MS)
    }
  }

  private dispatchPendingXP(): void {
    const p = this.pendingXp
    const pokemon = this.state.pokemon
    dispatchXPEvent({
      action: 'POKECHI_XP_EVENT',
      xpEarned: p.xpEarned,
      // A single reason labels the badge; mixed reasons just show "+N XP".
      reason: p.reasons.size === 1 ? [...p.reasons][0] ?? '' : '',
      evolved: p.evolved,
      pokemonType: pokemon?.type,
      level: pokemon?.level,
      earnedBadges: p.earnedBadges.length > 0 ? p.earnedBadges : undefined,
    })
    this.pendingXp = { xpEarned: 0, reason: '', evolved: false, reasons: new Set(), earnedBadges: [] }
  }

  public async addXP(
    amount: number,
    reason: XPReason
  ): Promise<{ evolved: boolean; pokemon?: UserPokemon; reveal?: { itemId: 'master-ball' | 'premier-ball'; pokemonType: PokemonType; isShiny: boolean } }> {
    // Capture pending ball reveal before evolution
    const pendingReveal = this.state.pokemon?.pendingBallReveal
    const pendingRevealType = this.state.pokemon?.pendingBallRevealType
    const pendingRevealShiny = this.state.pokemon?.pendingBallRevealShiny

    const badgesBefore = [...this.state.badges]
    const res = gameAddXP(this.state, amount)
    this.noteEarnedBadges(badgesBefore)
    this.save()
    this.emitXPEvent(amount, reason, res.evolved)

    // If pokemon just hatched from a Master/Premier ball, dispatch reveal event
    if (res.evolved && res.pokemon && pendingReveal && pendingRevealType) {
      const reveal = {
        itemId: pendingReveal,
        pokemonType: pendingRevealType,
        isShiny: pendingRevealShiny ?? false,
      }
      this.dispatchItemRevealEvent(reveal)
      return { ...res, reveal }
    }

    return res
  }

  public async spawnNewPokemon(): Promise<UserPokemon> {
    const pokemon = createNewPokemon(this.state)
    await this.saveDirect()
    return pokemon
  }

  public async selectPokemon(type: PokemonType, color?: PokemonColor): Promise<UserPokemon | undefined> {
    const pokemon = selectPokemonFromPokedex(this.state, type, color)
    await this.saveDirect()
    return pokemon
  }

  public async useRareCandy(): Promise<boolean> {
    const badgesBefore = [...this.state.badges]
    const ok = gameUseRareCandy(this.state)
    if (ok) {
      this.noteEarnedBadges(badgesBefore)
      // L11: a candy-only mutation earns no XP, so push an amount-0 event
      // to show any milestone toast now instead of on the next XP burst.
      if (this.pendingXp.earnedBadges.length > 0) {
        this.emitXPEvent(0, '', false)
      }
      await this.saveDirect()
    }
    return ok
  }

  // L8: the reveal ({revealedType, isShiny}) travels up to the UI that
  // called the item so it can name the species that just appeared.
  public async useMasterBall(): Promise<{ revealedType: PokemonType; isShiny: boolean } | undefined> {
    const res = gameUseMasterBall(this.state)
    if (res) {
      await this.saveDirect()
      // Reveal is now delayed until the pokeball hatches
      return { revealedType: res.revealedType, isShiny: res.isShiny }
    }
    return undefined
  }

  public async usePremierBall(): Promise<{ revealedType: PokemonType; isShiny: boolean } | undefined> {
    const res = gameUsePremierBall(this.state)
    if (res) {
      await this.saveDirect()
      // Reveal is now delayed until the pokeball hatches
      return { revealedType: res.revealedType, isShiny: true }
    }
    return undefined
  }

  public async updateSettings(settings: Partial<PokechiSettings>): Promise<PokechiSettings> {
    this.state.settings = {
      ...this.state.settings,
      ...settings,
    }
    if (this.state.pokemon && settings.scaleFactor !== undefined) {
      this.state.pokemon.scale = settings.scaleFactor
    }
    await this.saveDirect()
    return this.state.settings
  }
}
