// L3: typed message protocol between extension contexts and the service
// worker. One discriminated union for every request, a type guard for
// untrusted incoming messages, a typed sendMessage helper so no emitter can
// send `any` or miss a field, and the transient XP event (R5) broadcast.
import { XPReason, PokechiSettings, PokechiState, UserPokemon } from '../state'
import { ItemId } from './items'
import { BadgeConfig } from './badges'
import { PokemonColor, PokemonType } from './types'

export interface PokechiSuccess {
  success: true
}

export type PokechiFailure = {
  success: false
  error: string
}

export type PokechiRequest =
  | { type: 'GET_STATE' }
  | { type: 'USER_ACTIVE' }
  | { type: 'REGISTER_PET' }
  | { type: 'ADD_XP'; amount: number; reason: XPReason }
  | { type: 'SPAWN_NEW_POKEMON' }
  | { type: 'SELECT_POKEMON'; pokemonType: PokemonType; color?: PokemonColor }
  | { type: 'USE_ITEM'; itemId: ItemId }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<PokechiSettings> }
  | { type: 'OPEN_POKEDEX'; pokemonType?: PokemonType; isShiny?: boolean }

export type PokechiRequestType = PokechiRequest['type']

export type AddXpResult = { evolved: boolean; pokemon?: UserPokemon }

// Response payload per request type (the `success`/`error` envelope is
// added by PokechiResponse, so payloads below are the extra fields only).
// Requests with no payload use `unknown`, which is the identity element for
// intersections and keeps `res.success` narrowing simple.
export interface PokechiResponseMap {
  GET_STATE: { state: PokechiState }
  USER_ACTIVE: unknown
  REGISTER_PET: unknown
  ADD_XP: { result: AddXpResult; state: PokechiState }
  SPAWN_NEW_POKEMON: { pokemon: UserPokemon; state: PokechiState }
  SELECT_POKEMON: { pokemon?: UserPokemon; state: PokechiState }
  USE_ITEM: {
    used: boolean
    state: PokechiState
    // L8: present only when the item revealed a species (Master/Premier Ball).
    reveal?: { itemId: ItemId; revealedType: PokemonType; isShiny: boolean }
  }
  UPDATE_SETTINGS: { settings: PokechiSettings; state: PokechiState }
  OPEN_POKEDEX: unknown
}

// What an emitter may receive: the success payload, or a structured failure.
export type PokechiResponse<T extends PokechiRequestType> =
  | (PokechiSuccess & PokechiResponseMap[T])
  | PokechiFailure

// Runtime validation for messages coming from content scripts / pages —
// TypeScript types don't survive the messaging boundary.
export const XP_REASONS: readonly XPReason[] = [
  'active_minute',
  'tab_event',
  'youtube_song',
  'gmail_read',
  'gmail_deleted',
  'page_clicks',
  'typing',
  'rare_candy',
  'master_ball',
  'premier_ball',
  'hatch',
  'evolution',
  'generic',
]

export const ITEM_IDS: readonly ItemId[] = ['rare-candy', 'master-ball', 'premier-ball']

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

export function isItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && (ITEM_IDS as readonly string[]).includes(value)
}

// Rejects anything that doesn't look like a well-formed request, including
// out-of-range XP amounts (1 ≤ amount ≤ 100), unknown reasons/items and
// non-boolean isShiny.
export function isPokechiRequest(msg: unknown): msg is PokechiRequest {
  if (!isRecord(msg) || typeof msg.type !== 'string') return false

  switch (msg.type) {
    case 'GET_STATE':
    case 'USER_ACTIVE':
    case 'REGISTER_PET':
    case 'SPAWN_NEW_POKEMON':
      return true

    case 'ADD_XP': {
      const { amount, reason } = msg
      return (
        typeof amount === 'number' &&
        Number.isInteger(amount) &&
        amount >= 1 &&
        amount <= 100 &&
        typeof reason === 'string' &&
        (XP_REASONS as readonly string[]).includes(reason)
      )
    }

    case 'SELECT_POKEMON':
      return (
        typeof msg.pokemonType === 'string' &&
        (msg.color === undefined || typeof msg.color === 'string')
      )

    case 'USE_ITEM':
      return isItemId(msg.itemId)

    case 'UPDATE_SETTINGS':
      return isRecord(msg.settings)

    case 'OPEN_POKEDEX':
      return (
        (msg.pokemonType === undefined || typeof msg.pokemonType === 'string') &&
        (msg.isShiny === undefined || typeof msg.isShiny === 'boolean')
      )

    default:
      return false
  }
}

// Typed send helper for every emitter (popup, pokedex, newtab, content
// scripts). Never rejects: a missing service worker or an answerless
// listener becomes `{ success: false, error }`, so fire-and-forget callers
// can simply `void` it and request/response callers only branch on
// `res.success`.
export async function sendPokechiMessage<T extends PokechiRequest>(
  message: T
): Promise<PokechiResponse<T['type']>> {
  try {
    const res: unknown = await chrome.runtime.sendMessage(message)
    if (isRecord(res) && typeof res.success === 'boolean') {
      return res as PokechiResponse<T['type']>
    }
    return { success: false, error: 'Empty response from background' }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// R5 — transient, coalesced XP event. Persistent state reaches consumers
// through chrome.storage.onChanged; this message only carries what the
// floating pet animates on top of it (+N badge, temp XP bar, evolution FX).
// Canonical definition lives here (the protocol module); common/state-sync
// re-exports it as XPEvent for its existing consumers.
export interface XPEventMessage {
  action: 'POKECHI_XP_EVENT'
  xpEarned: number
  /** Single reason, or '' when the window coalesced several different ones. */
  reason: string
  evolved: boolean
  pokemonType?: PokemonType
  level?: number
  // L11: badges completed inside this coalescing window, so the pet can
  // celebrate each milestone exactly once (refreshBadges only ever reports
  // a badge as new the first time it is earned).
  earnedBadges?: BadgeConfig[]
}

export function isXPEventMessage(msg: unknown): msg is XPEventMessage {
  return (
    isRecord(msg) &&
    msg.action === 'POKECHI_XP_EVENT' &&
    typeof msg.xpEarned === 'number' &&
    typeof msg.evolved === 'boolean'
  )
}
