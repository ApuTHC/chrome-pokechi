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
  // For delayed ball reveal: store the actual pokemon type and shiny status
  // until the pokeball hatches (level 0 -> 1)
  pendingBallRevealType?: PokemonType
  pendingBallRevealShiny?: boolean
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
  customNewTab: boolean
  language: string
}

export interface PokechiState {
  // L6: version of the stored shape. States written before this field
  // existed are treated as version 0 and upgraded by the migrations in
  // state-manager.ts on load.
  schemaVersion: number
  pokemon?: UserPokemon
  pokedex: PokemonType[]
  shinyPokedex: PokemonType[]
  roster: Roster
  totalXP: number
  hatchCount: number
  items: ItemInventory
  itemUsageCount: ItemUsageCount
  badges: string[]
  challenges: string[]
  settings: PokechiSettings
}

// L3: canonical list of XP sources. XP_REASONS in common/messages.ts must
// list every member (it is what the ADD_XP guard validates against).
export type XPReason =
  | 'active_minute'
  | 'tab_event'
  | 'youtube_song'
  | 'gmail_read'
  | 'gmail_deleted'
  | 'page_clicks'
  | 'typing'
  | 'rare_candy'
  | 'master_ball'
  | 'premier_ball'
  | 'hatch'
  | 'evolution'
  | 'generic'
