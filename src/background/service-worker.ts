import { StateManager } from './state-manager'
import { initTabTracker, notifyUserActive } from './tab-tracker'
import { initPetTabs, registerPetTab } from './pet-tabs'
import { isPokechiRequest } from '../common/messages'
import type { ItemId } from '../common/items'
import type { PokemonType } from '../common/types'

const stateManager = StateManager.getInstance()

// Initialize state and tracker on service worker boot
void (async () => {
  await stateManager.init()
  initTabTracker(stateManager)
  initPetTabs()
  console.log('[Pokechi] Background Service Worker initialized!')
})()

chrome.runtime.onInstalled.addListener(async (details) => {
  await stateManager.init()
  if (details.reason === 'install') {
    // Open Pokedex or welcome tab if desired
    console.log('[Pokechi] Extension installed for the first time!')
  }
})

// Message listener. L3: the type guard is the only thing between an
// arbitrary message and the handlers, so anything malformed (or simply not
// ours) is answered with the historical failure shape. Inside, the switch is
// exhaustive over PokechiRequest — the `never` assignment fails compilation
// the day a request type is added without its own case.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isPokechiRequest(message)) {
    sendResponse({ success: false, error: 'Unknown action' })
    return false
  }

  const request = message

  // Handle async operations properly — always answer, even on unexpected
  // errors, so popup/pokedex callers never hang awaiting a response.
  void (async () => {
    try {
      // L4: state is created lazily in init(); idempotent, so this is just a
      // guard for messages that arrive before the boot promise resolved.
      await stateManager.init()
      switch (request.type) {
        case 'GET_STATE': {
          sendResponse({ success: true, state: stateManager.getState() })
          break
        }

        case 'USER_ACTIVE': {
          notifyUserActive()
          sendResponse({ success: true })
          break
        }

        // R5: the tab's content script announces it hosts the floating pet, so
        // XP events target only registered tabs (no chrome.tabs.query({})).
        case 'REGISTER_PET': {
          registerPetTab(sender.tab?.id)
          sendResponse({ success: true })
          break
        }

        // amount/reason already validated by isPokechiRequest (1..100, known
        // list); L2 flushes the debounced write before answering the sender.
        case 'ADD_XP': {
          notifyUserActive()
          const result = await stateManager.addXP(request.amount, request.reason)
          await stateManager.flushPendingSave()
          sendResponse({ success: true, result, state: stateManager.getState() })
          break
        }

        case 'SPAWN_NEW_POKEMON': {
          const pokemon = await stateManager.spawnNewPokemon()
          sendResponse({ success: true, pokemon, state: stateManager.getState() })
          break
        }

        case 'SELECT_POKEMON': {
          const pokemon = await stateManager.selectPokemon(request.pokemonType, request.color)
          sendResponse({ success: true, pokemon, state: stateManager.getState() })
          break
        }

        case 'USE_ITEM': {
          let used = false
          let reveal: { itemId: ItemId; revealedType: PokemonType; isShiny: boolean } | undefined
          switch (request.itemId) {
            case 'rare-candy':
              used = await stateManager.useRareCandy()
              break
            case 'master-ball': {
              const res = await stateManager.useMasterBall()
              used = !!res
              if (res) reveal = { itemId: 'master-ball', ...res }
              break
            }
            case 'premier-ball': {
              const res = await stateManager.usePremierBall()
              used = !!res
              if (res) reveal = { itemId: 'premier-ball', ...res }
              break
            }
            default: {
              // itemId is a validated ItemId; a new item must get its own case.
              const _unhandled: never = request.itemId
              void _unhandled
            }
          }
          sendResponse({ success: true, used, reveal, state: stateManager.getState() })
          break
        }

        case 'UPDATE_SETTINGS': {
          const settings = await stateManager.updateSettings(request.settings)
          sendResponse({ success: true, settings, state: stateManager.getState() })
          break
        }

        case 'OPEN_POKEDEX': {
          const base = chrome.runtime.getURL('src/pokedex/pokedex.html')
          let hash = ''
          if (request.pokemonType) {
            hash =
              '#locate=' +
              encodeURIComponent(request.pokemonType) +
              (request.isShiny ? '&shiny=1' : '')
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

        default: {
          // Exhaustiveness: request is PokechiRequest, and every member is
          // handled above, so only `never` can reach here.
          const _exhausted: never = request
          void _exhausted
          sendResponse({ success: false, error: 'Unknown action' })
          break
        }
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
