import { StateManager } from './state-manager'
import { initTabTracker, notifyUserActive } from './tab-tracker'

const stateManager = StateManager.getInstance()

// Initialize state and tracker on service worker boot
void (async () => {
  await stateManager.init()
  initTabTracker(stateManager)
  console.log('[Pokechi] Background Service Worker initialized!')
})()

chrome.runtime.onInstalled.addListener(async (details) => {
  await stateManager.init()
  if (details.reason === 'install') {
    // Open Pokedex or welcome tab if desired
    console.log('[Pokechi] Extension installed for the first time!')
  }
})

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false
  }

  // Handle async operations properly — always answer, even on unexpected
  // errors, so popup/pokedex callers never hang awaiting a response.
  ;(async () => {
    try {
      switch (message.type) {
      case 'GET_STATE': {
        const state = stateManager.getState()
        sendResponse({ success: true, state })
        break
      }

      case 'USER_ACTIVE': {
        notifyUserActive()
        sendResponse({ success: true })
        break
      }

      case 'ADD_XP': {
        notifyUserActive()
        const amount = Number(message.amount) || 0
        const reason = message.reason || 'generic'
        if (amount > 0) {
          const result = await stateManager.addXP(amount, reason)
          sendResponse({ success: true, result, state: stateManager.getState() })
        } else {
          sendResponse({ success: false, error: 'Invalid amount' })
        }
        break
      }

      case 'SPAWN_NEW_POKEMON': {
        const pokemon = await stateManager.spawnNewPokemon()
        sendResponse({ success: true, pokemon, state: stateManager.getState() })
        break
      }

      case 'SELECT_POKEMON': {
        const pokemon = await stateManager.selectPokemon(message.pokemonType, message.color)
        sendResponse({ success: true, pokemon, state: stateManager.getState() })
        break
      }

      case 'USE_ITEM': {
        const itemId = message.itemId
        let ok = false
        if (itemId === 'rare-candy') {
          ok = await stateManager.useRareCandy()
        } else if (itemId === 'master-ball') {
          ok = await stateManager.useMasterBall()
        } else if (itemId === 'premier-ball') {
          ok = await stateManager.usePremierBall()
        }
        sendResponse({ success: ok, state: stateManager.getState() })
        break
      }

      case 'UPDATE_SETTINGS': {
        const updated = await stateManager.updateSettings(message.settings || {})
        sendResponse({ success: true, settings: updated, state: stateManager.getState() })
        break
      }

      case 'OPEN_POKEDEX': {
        const base = chrome.runtime.getURL('src/pokedex/pokedex.html')
        let hash = ''
        if (message.pokemonType) {
          hash =
            '#locate=' +
            encodeURIComponent(String(message.pokemonType)) +
            (message.isShiny ? '&shiny=1' : '')
        }
        const url = base + hash
        try {
          const tabs = await chrome.tabs.query({ url: base + '*' })
          const existing = tabs.find((t) => t.id !== undefined)
          if (existing && existing.id !== undefined) {
            await chrome.tabs.update(existing.id, { url, active: true })
            if (existing.windowId !== undefined) {
              await chrome.windows.update(existing.windowId, { focused: true })
            }
          } else {
            await chrome.tabs.create({ url })
          }
        } catch {
          await chrome.tabs.create({ url })
        }
        sendResponse({ success: true })
        break
      }

      default:
        sendResponse({ success: false, error: 'Unknown action' })
        break
      }
    } catch (err) {
      console.error('[Pokechi] Message handler failed:', err)
      try {
        sendResponse({ success: false, error: String(err) })
      } catch {}
    }
  })()

  return true // Keep sendResponse open for async
})
