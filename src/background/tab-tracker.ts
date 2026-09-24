import { StateManager } from './state-manager'

const XP_PER_MINUTE = 5
const XP_PER_TAB_EVENT = 7
const TAB_EVENT_COOLDOWN_MS = 600

// L1: activity is persisted in chrome.storage.session instead of a module
// variable. An in-memory timestamp re-seeded itself on every service-worker
// wake-up, so the active-minute alarm paid out XP while the user was away.
const LAST_ACTIVE_KEY = 'pokechi_lastActiveAt'
const ACTIVE_WINDOW_MS = 2 * 60 * 1000
// Throttled writes: at most one session write every 25 s.
const ACTIVE_WRITE_THROTTLE_MS = 25_000
const ACTIVE_ALARM_NAME = 'pokechi_active_minute_timer'

let lastActiveWriteAt = 0
let lastTabEventTime = 0

export function notifyUserActive(): void {
  const now = Date.now()
  if (now - lastActiveWriteAt < ACTIVE_WRITE_THROTTLE_MS) return
  lastActiveWriteAt = now
  try {
    void chrome.storage.session.set({ [LAST_ACTIVE_KEY]: now }).catch(() => {})
  } catch {
    // Session storage unavailable → the alarm simply won't grant XP.
  }
}

export function initTabTracker(stateManager: StateManager): void {
  // 1. Tab open / close tracking
  chrome.tabs.onCreated.addListener(() => {
    const now = Date.now()
    if (now - lastTabEventTime < TAB_EVENT_COOLDOWN_MS) return
    lastTabEventTime = now
    notifyUserActive()
    void stateManager.addXP(XP_PER_TAB_EVENT, 'tab_event')
  })

  chrome.tabs.onRemoved.addListener(() => {
    const now = Date.now()
    if (now - lastTabEventTime < TAB_EVENT_COOLDOWN_MS) return
    lastTabEventTime = now
    notifyUserActive()
    void stateManager.addXP(XP_PER_TAB_EVENT, 'tab_event')
  })

  // 2. Active minute tracking using chrome.alarms.
  // L12: create the alarm only if it doesn't already exist — recreating it
  // on every wake-up reset the 1-minute cadence.
  void (async () => {
    try {
      const existing = await chrome.alarms.get(ACTIVE_ALARM_NAME)
      if (!existing) {
        await chrome.alarms.create(ACTIVE_ALARM_NAME, {
          periodInMinutes: 1,
          delayInMinutes: 1,
        })
      }
    } catch {
      // alarms unavailable → no minute XP, everything else keeps working.
    }
  })()

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ACTIVE_ALARM_NAME) return
    void (async () => {
      try {
        const res = await chrome.storage.session.get([LAST_ACTIVE_KEY])
        const last = res[LAST_ACTIVE_KEY]
        const idleMs = typeof last === 'number' ? Date.now() - last : Infinity
        // Grant minute XP only if the user was actually active recently.
        if (idleMs <= ACTIVE_WINDOW_MS) {
          await stateManager.addXP(XP_PER_MINUTE, 'active_minute')
        }
      } catch {
        // Read failure → skip this minute rather than pay out blindly.
      }
    })()
  })
}
