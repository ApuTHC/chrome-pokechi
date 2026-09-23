import { PokemonColor, PokemonElementType, PokemonType } from './common/types'

export interface UserPokemon {
  id: number
  type: PokemonType
  name: string
  level: number
  xp: number
  types: PokemonElementType[]
  evolutionLine: string[]
  state: 'pokeball' | 'idle' | 'walking'
  scale: number
  isTransitionIn: boolean
  leftPosition?: number
  direction?: 'left' | 'right'
  isHovered?: boolean
  color: PokemonColor
  canGainXP: boolean
  pendingAlreadyOwned?: boolean
  pendingBallReveal?: 'master-ball' | 'premier-ball'
}

export interface RosterEntry {
  type: PokemonType
  level: number
  xp: number
  color: PokemonColor
  evolutionLine: PokemonType[]
}

export type Roster = { [basePokemon: string]: RosterEntry }

export type ItemInventory = { [itemId: string]: number }
export type ItemUsageCount = { [itemId: string]: number }

export interface PokechiSettings {
  scaleFactor: number
  soundEnabled: boolean
  petVisible: boolean
  language: string
}

export interface PokechiState {
  pokemon?: UserPokemon
  pokedex: PokemonType[]
  shinyPokedex: PokemonType[]
  roster: Roster
  totalXP: number
  hatchCount: number
  items: ItemInventory
  itemUsageCount: ItemUsageCount
  badges: string[]
  settings: PokechiSettings
}

export type XPReason = 
  | 'active_minute'
  | 'tab_event'
  | 'youtube_song'
  | 'gmail_read'
  | 'gmail_deleted'
  | 'page_clicks'
  | 'typing'
  | 'rare_candy'
