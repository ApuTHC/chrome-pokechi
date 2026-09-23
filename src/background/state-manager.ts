import { PokechiState, UserPokemon, PokechiSettings, XPReason } from '../types'
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
import { PokemonColor, PokemonType } from '../common/types'

const STORAGE_KEY = 'pokechi_state'

export function createDefaultState(): PokechiState {
  const settings: PokechiSettings = {
    scaleFactor: 1.0,
    soundEnabled: true,
    petVisible: true,
    language: 'en',
  }

  const state: PokechiState = {
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
  private state: PokechiState = createDefaultState()
  private isLoaded = false
  private saveTimeout?: NodeJS.Timeout

  private constructor() {}

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager()
    }
    return StateManager.instance
  }

  public async init(): Promise<PokechiState> {
    if (this.isLoaded) {
      return this.state
    }

    try {
      const result = await chrome.storage.local.get([STORAGE_KEY])
      if (result && result[STORAGE_KEY]) {
        const stored = result[STORAGE_KEY] as Partial<PokechiState>
        this.state = {
          ...createDefaultState(),
          ...stored,
          settings: {
            ...createDefaultState().settings,
            ...(stored.settings || {}),
          },
          items: stored.items || {},
          itemUsageCount: stored.itemUsageCount || {},
          pokedex: stored.pokedex || [],
          shinyPokedex: stored.shinyPokedex || [],
          roster: stored.roster || {},
          badges: stored.badges || [],
        }

        if (!this.state.pokemon) {
          createStarterPokemon(this.state)
        }
      } else {
        this.state = createDefaultState()
        await this.saveDirect()
      }
    } catch (e) {
      console.error('Pokechi: error loading state from chrome.storage', e)
      this.state = createDefaultState()
    }

    this.isLoaded = true
    refreshBadges(this.state)
    return this.state
  }

  public getState(): PokechiState {
    return this.state
  }

  public async save(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.saveDirect()
    }, 400)
  }

  public async saveDirect(): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: this.state })
      this.broadcastState()
    } catch (e) {
      console.error('Pokechi: error saving state', e)
    }
  }

  public broadcastState(extra?: Record<string, unknown>): void {
    const payload = {
      action: 'POKECHI_STATE_UPDATED',
      state: this.state,
      ...extra,
    }

    // Send to popup / options / pokedex
    try {
      chrome.runtime.sendMessage(payload).catch(() => {})
    } catch {}

    // Send to all active tabs for floating pet
    try {
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, payload).catch(() => {})
          }
        }
      })
    } catch {}
  }

  public async addXP(
    amount: number,
    reason: XPReason
  ): Promise<{ evolved: boolean; pokemon?: UserPokemon }> {
    const res = gameAddXP(this.state, amount)
    await this.save()
    this.broadcastState({ reason, xpEarned: amount, evolved: res.evolved })
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
    const ok = gameUseRareCandy(this.state)
    if (ok) {
      await this.saveDirect()
    }
    return ok
  }

  public async useMasterBall(): Promise<boolean> {
    const res = gameUseMasterBall(this.state)
    if (res) {
      await this.saveDirect()
      return true
    }
    return false
  }

  public async usePremierBall(): Promise<boolean> {
    const res = gameUsePremierBall(this.state)
    if (res) {
      await this.saveDirect()
      return true
    }
    return false
  }

  public async updateSettings(settings: Partial<PokechiSettings>): Promise<PokechiSettings> {
    this.state.settings = {
      ...this.state.settings,
      ...settings,
    }
    if (this.state.pokemon && settings.scaleFactor) {
      this.state.pokemon.scale = settings.scaleFactor
    }
    await this.saveDirect()
    return this.state.settings
  }
}
