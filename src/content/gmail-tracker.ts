// Tracks Gmail emails read (5 pts) and deleted (2 pts)
import { sendPokechiMessage } from '../common/messages'

const readEmailIds = new Set<string>()

// L10: award the "read" XP through one funnel so the click handler and the
// class observer below can never double-count the same thread.
function markRowRead(row: HTMLElement): void {
  const id =
    row.getAttribute('data-legacy-thread-id') ||
    row.getAttribute('id') ||
    row.innerText.slice(0, 40)
  if (!id || readEmailIds.has(id)) return
  readEmailIds.add(id)
  void sendPokechiMessage({ type: 'ADD_XP', amount: 5, reason: 'gmail_read' })
}

// L10: Gmail's trash button is only identified by [act="10"] (stable) and
// its localized tooltip/aria-label — enumerate every language the extension
// ships plus German, instead of the old EN/ES-only substring match.
const DELETE_LABELS = [
  'Delete', // en
  'Eliminar', // es
  'Excluir', // pt
  'Supprimer', // fr
  'Elimina', // it
  'Löschen', // de
  '삭제', // ko
  '删除', // zh
  '削除', // ja
]
const DELETE_SELECTOR =
  '[act="10"], ' +
  DELETE_LABELS.flatMap((label) => [`[aria-label*="${label}" i]`, `[data-tooltip*="${label}" i]`]).join(
    ', '
  )

export function initGmailTracker(): void {
  if (window.location.hostname !== 'mail.google.com') {
    return
  }

  // 1. Detect reading new emails by click
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // In Gmail, unread email rows have classes 'zA zE'
      const unreadRow = target.closest('tr.zE, tr.zA.zE') as HTMLElement | null
      if (unreadRow) {
        markRowRead(unreadRow)
      }

      // 2. Detect deleting emails: the [act="10"] action id, or a localized
      // delete label on the button that was clicked.
      const deleteButton = target.closest(DELETE_SELECTOR)
      if (deleteButton) {
        void sendPokechiMessage({ type: 'ADD_XP', amount: 2, reason: 'gmail_deleted' })
      }
    },
    { capture: true, passive: true }
  )

  // L10: also detect "read" when the row loses its unread class without a
  // click landing on it (keyboard navigation, opening via search, coming
  // back from a thread...). Only the unread→read transition counts — Gmail
  // toggles classes constantly for selection and labels, and oldValue is
  // what tells those apart from an actual read.
  const readObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'attributes') continue
      const row = mutation.target as HTMLElement
      if (!row.matches('tr')) continue
      const wasUnread =
        typeof mutation.oldValue === 'string' && /(^|\s)zE(\s|$)/.test(mutation.oldValue)
      if (wasUnread && !row.classList.contains('zE')) {
        markRowRead(row)
      }
    }
  })
  readObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true,
    subtree: true,
  })

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
          void sendPokechiMessage({ type: 'ADD_XP', amount: 2, reason: 'gmail_deleted' })
        }
      }
    },
    { passive: true }
  )
}
