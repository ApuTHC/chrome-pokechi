import { FloatingPet } from './floating-pet'
import { initActivityTracker } from './activity-tracker'
import { subscribeToState } from '../common/state-sync'
import { isXPEventMessage, sendPokechiMessage } from '../common/messages'

const pet = new FloatingPet()

async function main(): Promise<void> {
  // 1. Initialize activity trackers (site-specific ones live in
  // content-sites.ts and are only injected on their own hosts).
  initActivityTracker()

  // 2. Fetch current state from service worker
  const res = await sendPokechiMessage({ type: 'GET_STATE' })
  if (res.success) {
    pet.init(res.state)
  } else {
    console.warn('[Pokechi] Could not fetch initial state:', res.error)
  }

  // 3. Persistent state → re-render via storage change (no broadcast).
  subscribeToState((state) => pet.updateState(state))

  // 4. Transient coalesced XP events → badge / temp bar / evolution FX.
  chrome.runtime.onMessage.addListener((message) => {
    if (isXPEventMessage(message)) {
      pet.onXPEvent(message)
    }
  })

  // R5: register this tab AFTER the listeners exist, so the background can
  // send XP events here (instead of querying every open tab) without ever
  // hitting a "Receiving end does not exist" that would prune the tab.
  // Best-effort — a later state fetch re-syncs the pet if this fails.
  void sendPokechiMessage({ type: 'REGISTER_PET' })
}

// Start after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void main()
  })
} else {
  void main()
}
