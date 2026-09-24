import { XPEvent, ItemRevealEventMessage } from '../common/state-sync'

// R5 — registry of tabs whose content script hosts the floating pet.
// Replaces chrome.tabs.query({}) on every XP gain: the background only
// messages tabs that explicitly registered, and drops them when a send
// proves the receiver is gone.
const SESSION_KEY = 'pokechi_pet_tabs'

const registeredTabs = new Set<number>()
let loadPromise: Promise<void> | null = null

// chrome.storage.session survives service-worker restarts within the
// browser session, so the registry is restored without re-registering.
function load(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const res = await chrome.storage.session.get([SESSION_KEY])
        const ids = res[SESSION_KEY]
        if (Array.isArray(ids)) {
          for (const id of ids) {
            if (typeof id === 'number') registeredTabs.add(id)
          }
        }
      } catch {
        // Session storage unavailable — start with an empty registry;
        // tabs re-register on their next content-script boot.
      }
    })()
  }
  return loadPromise
}

function persist(): void {
  try {
    void chrome.storage.session.set({ [SESSION_KEY]: [...registeredTabs] }).catch(() => {})
  } catch {
    // Best effort: an unpersisted registry only costs a re-register.
  }
}

export function initPetTabs(): void {
  void load()
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (registeredTabs.delete(tabId)) persist()
  })
}

export function registerPetTab(tabId: number | undefined): void {
  if (tabId === undefined) return
  void load().then(() => {
    if (!registeredTabs.has(tabId)) {
      registeredTabs.add(tabId)
      persist()
    }
  })
}

// Fan the coalesced XP event out to registered tabs only. A rejection that
// means "no receiver" prunes the tab; any other rejection (our listener
// doesn't answer one-way events) is ignored so healthy tabs stay registered.
export async function sendXPEventToTabs(event: XPEvent): Promise<void> {
  await load()
  const dead: number[] = []
  await Promise.all(
    [...registeredTabs].map(async (tabId) => {
      try {
        await chrome.tabs.sendMessage(tabId, event)
      } catch (err) {
        if (String(err).includes('Receiving end does not exist')) {
          dead.push(tabId)
        }
      }
    })
  )
  if (dead.length > 0) {
    for (const tabId of dead) registeredTabs.delete(tabId)
    persist()
  }
}

// XP event delivery to both kinds of consumers:
// - extension pages (newtab pet) via runtime messaging,
// - content-script pets in normal tabs via the registry above.
export function dispatchXPEvent(event: XPEvent): void {
  try {
    void chrome.runtime.sendMessage(event).catch(() => {})
  } catch {
    // No extension page listening — only the tab pets care.
  }
  void sendXPEventToTabs(event)
}

// Same fan-out for item reveal events (Master Ball / Premier Ball)
async function sendItemRevealToTabs(event: ItemRevealEventMessage): Promise<void> {
  await load()
  const dead: number[] = []
  await Promise.all(
    [...registeredTabs].map(async (tabId) => {
      try {
        await chrome.tabs.sendMessage(tabId, event)
      } catch (err) {
        if (String(err).includes('Receiving end does not exist')) {
          dead.push(tabId)
        }
      }
    })
  )
  if (dead.length > 0) {
    for (const tabId of dead) registeredTabs.delete(tabId)
    persist()
  }
}

export function dispatchItemRevealEvent(event: ItemRevealEventMessage): void {
  try {
    void chrome.runtime.sendMessage(event).catch(() => {})
  } catch {
    // No extension page listening — only the tab pets care.
  }
  void sendItemRevealToTabs(event)
}
