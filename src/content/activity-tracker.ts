// Tracks clicks (1 pt per 10 clicks) and typing (1 pt per char typed/deleted)
// Zero keylogging: strictly count keystrokes, completely skip password inputs.

let clickCount = 0
let pendingKeystrokes = 0
let flushTimeout: NodeJS.Timeout | undefined

function flushKeystrokes(): void {
  if (pendingKeystrokes > 0) {
    const amount = pendingKeystrokes
    pendingKeystrokes = 0
    try {
      chrome.runtime.sendMessage({
        type: 'ADD_XP',
        amount,
        reason: 'typing',
      }).catch(() => {})
    } catch {}
  }
}

export function initActivityTracker(): void {
  // 1. Click tracking (1 pt every 10 clicks)
  window.addEventListener(
    'click',
    (e) => {
      // Don't count clicks inside Pokechi's own floating pet
      const path = e.composedPath()
      const isPokechi = path.some(
        (el) => el instanceof HTMLElement && el.id === 'pokechi-host'
      )
      if (isPokechi) return

      clickCount++
      if (clickCount >= 10) {
        clickCount = 0
        try {
          chrome.runtime.sendMessage({
            type: 'ADD_XP',
            amount: 1,
            reason: 'page_clicks',
          }).catch(() => {})
        } catch {}
      }
    },
    { passive: true, capture: true }
  )

  // 2. Typing tracking (1 pt per character typed or deleted, zero keylogging)
  window.addEventListener(
    'keydown',
    (e) => {
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
