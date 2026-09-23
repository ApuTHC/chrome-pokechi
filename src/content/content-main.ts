import { FloatingPet } from './floating-pet'
import { initActivityTracker } from './activity-tracker'
import { initYouTubeTracker } from './youtube-tracker'
import { initGmailTracker } from './gmail-tracker'

const pet = new FloatingPet()

async function main(): Promise<void> {
  // 1. Initialize activity trackers
  initActivityTracker()
  initYouTubeTracker()
  initGmailTracker()

  // 2. Fetch current state from service worker
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_STATE' })
    if (res && res.success && res.state) {
      pet.init(res.state)
    }
  } catch (err) {
    console.warn('[Pokechi] Could not fetch initial state:', err)
  }

  // 3. Listen for broadcast state updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.action === 'POKECHI_STATE_UPDATED' && message.state) {
      pet.updateState(message.state, message)
    }
  })
}

// Start after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void main()
  })
} else {
  void main()
}
