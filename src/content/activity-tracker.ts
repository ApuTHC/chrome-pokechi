// Tracks clicks (1 pt per 10 clicks) and typing (1 pt per char typed/deleted)
// Zero keylogging: strictly count keystrokes, completely skip password inputs.
import { sendPokechiMessage } from '../common/messages'

let clickCount = 0
let pendingKeystrokes = 0
let flushTimeout: ReturnType<typeof setTimeout> | undefined

// L1: report real per-tab activity (throttled) so the background's
// active-minute XP only pays out while the user is actually doing things —
// independent of tab open/close events.
const USER_ACTIVE_THROTTLE_MS = 20_000
let lastUserActiveAt = 0

function notifyUserActive(): void {
  const now = Date.now()
  if (now - lastUserActiveAt < USER_ACTIVE_THROTTLE_MS) return
  lastUserActiveAt = now
  // Fire-and-forget: the background being unavailable only costs this
  // sample; the next throttled window retries.
  void sendPokechiMessage({ type: 'USER_ACTIVE' })
}

function flushKeystrokes(): void {
  if (pendingKeystrokes > 0) {
    const amount = pendingKeystrokes
    pendingKeystrokes = 0
    void sendPokechiMessage({ type: 'ADD_XP', amount, reason: 'typing' })
  }
}

export function initActivityTracker(): void {
  // 1. Click tracking (1 pt every 10 clicks)
  window.addEventListener(
    'click',
    (e) => {
      // L1: every click counts as activity, even below the XP threshold.
      notifyUserActive()

      // Don't count clicks inside Pokechi's own floating pet
      const path = e.composedPath()
      const isPokechi = path.some(
        (el) => el instanceof HTMLElement && el.id === 'pokechi-host'
      )
      if (isPokechi) return

      clickCount++
      if (clickCount >= 2) {
        clickCount = 0
        void sendPokechiMessage({ type: 'ADD_XP', amount: 1, reason: 'page_clicks' })
      }
    },
    { passive: true, capture: true }
  )

  // 2. Typing tracking (1 pt per character typed or deleted, zero keylogging)
  window.addEventListener(
    'keydown',
    (e) => {
      // L1: any keystroke counts as activity — reported before the
      // editable/password filters so non-XP keys still refresh the window.
      notifyUserActive()

      // Ignore if target is a password input
      const target = e.target as HTMLElement | null
      if (
        target instanceof HTMLInputElement &&
        target.type.toLowerCase() === 'password'
      ) {
        return
      }

      // Check if inside an editable context
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (!isEditable) return

      // Count printable characters or Backspace/Delete
      const isChar = e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey
      const isDelete = e.key === 'Backspace' || e.key === 'Delete'

      if (isChar || isDelete) {
        pendingKeystrokes++

        // Flush in batches of 20 or after 2.5s
        if (pendingKeystrokes >= 20) {
          if (flushTimeout) clearTimeout(flushTimeout)
          flushKeystrokes()
        } else {
          if (flushTimeout) clearTimeout(flushTimeout)
          flushTimeout = setTimeout(flushKeystrokes, 2500)
        }
      }
    },
    { passive: true, capture: true }
  )
}
