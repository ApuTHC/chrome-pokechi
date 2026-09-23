// Tracks Gmail emails read (5 pts) and deleted (2 pts)

const readEmailIds = new Set<string>()

export function initGmailTracker(): void {
  if (window.location.hostname !== 'mail.google.com') {
    return
  }

  // 1. Detect reading new emails
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // In Gmail, unread email rows have classes 'zA zE'
      const unreadRow = target.closest('tr.zE, tr.zA.zE') as HTMLElement | null
      if (unreadRow) {
        // Extract a thread identifier or text snippet
        const id =
          unreadRow.getAttribute('data-legacy-thread-id') ||
          unreadRow.getAttribute('id') ||
          unreadRow.innerText.slice(0, 40)

        if (id && !readEmailIds.has(id)) {
          readEmailIds.add(id)
          try {
            chrome.runtime.sendMessage({
              type: 'ADD_XP',
              amount: 5,
              reason: 'gmail_read',
            }).catch(() => {})
          } catch {}
        }
      }

      // 2. Detect deleting emails
      // Clicks on delete action button: [act="10"], or aria-label containing "Eliminar"/"Delete"
      const deleteButton = target.closest(
        '[act="10"], [aria-label*="Eliminar" i], [aria-label*="Delete" i], [data-tooltip*="Eliminar" i], [data-tooltip*="Delete" i]'
      )

      if (deleteButton) {
        try {
          chrome.runtime.sendMessage({
            type: 'ADD_XP',
            amount: 2,
            reason: 'gmail_deleted',
          }).catch(() => {})
        } catch {}
      }
    },
    { capture: true, passive: true }
  )

  // 3. Detect keyboard shortcut for delete in Gmail ('#')
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === '#' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement | null
        const isTyping =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target?.isContentEditable
        if (!isTyping) {
          try {
            chrome.runtime.sendMessage({
              type: 'ADD_XP',
              amount: 2,
              reason: 'gmail_deleted',
            }).catch(() => {})
          } catch {}
        }
      }
    },
    { passive: true }
  )
}
