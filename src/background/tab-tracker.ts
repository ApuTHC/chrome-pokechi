import { StateManager } from './state-manager'

const XP_PER_MINUTE = 5
const XP_PER_TAB_EVENT = 7
const TAB_EVENT_COOLDOWN_MS = 600

let lastTabEventTime = 0
let lastActiveTimestamp = Date.now()

export function notifyUserActive(): void {
  lastActiveTimestamp = Date.now()
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

  // 2. Active minute tracking using chrome.alarms
  chrome.alarms.create('pokechi_active_minute_timer', {
    periodInMinutes: 1,
    delayInMinutes: 1,
  })

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pokechi_active_minute_timer') {
      const now = Date.now()
      // If there has been activity within the last 2 minutes, grant active minute XP
      if (now - lastActiveTimestamp <= 2 * 60 * 1000) {
        void stateManager.addXP(XP_PER_MINUTE, 'active_minute')
      }
    }
  })
}
