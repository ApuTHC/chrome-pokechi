import { PokechiState } from '../state'

// Single source of truth for the storage key: the background writes it
// (StateManager) and every consumer (popup, pokedex, newtab, content pet)
// subscribes to it, so they must all agree on the name.
export const POKECHI_STATE_KEY = 'pokechi_state'

// R5 — the transient XP event type is part of the message protocol, so its
// canonical definition lives in common/messages.ts; re-exported here under
// its short name for the pet/notification consumers.
export type { XPEventMessage as XPEvent, ItemRevealEventMessage } from './messages'

// Subscribe to persisted-state changes. Replaces the old full-state
// broadcast on every mutation: the write already reaches every context
// (popup, pokedex, newtab, content scripts) without extra tab messaging.
export function subscribeToState(onChange: (state: PokechiState) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return
    const change = changes[POKECHI_STATE_KEY]
    if (change && change.newValue) {
      onChange(change.newValue as PokechiState)
    }
  })
}
