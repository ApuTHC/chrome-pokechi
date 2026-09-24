import { FloatingPet } from '../content/floating-pet'
import { initActivityTracker } from '../content/activity-tracker'
import { POKEMON_DATA } from '../common/pokemon-data'
import { PokemonGeneration, PokemonType } from '../common/types'
import { PokechiState } from '../state'
import { subscribeToState } from '../common/state-sync'
import { isXPEventMessage, isItemRevealEventMessage, sendPokechiMessage } from '../common/messages'
import { getStrings, Strings } from '../common/i18n'

const pet = new FloatingPet()
let lastCustomNewTab = true

// L5: static chrome (title, placeholder, footer, disabled message) is
// painted once per language change — a settings write the user just made
// or the first state load. The caller owns documentElement.lang.
let lastLabelsLang = ''

function applyLabels(strings: Strings): void {
  document.title = strings.newtabTitle
  const setText = (id: string, value: string): void => {
    const el = document.getElementById(id)
    if (el) el.textContent = value
  }
  setText('ntp-off-msg', strings.newtabDisabledMessage)
  const footer = document.querySelector('footer')
  if (footer) footer.textContent = strings.newtabFooter
  const input = document.getElementById('search-input') as HTMLInputElement | null
  if (input) input.placeholder = strings.newtabSearchPlaceholder
  // S4: the visually-hidden label must be localized too, otherwise screen
  // readers keep announcing the static English text from the markup.
  const searchLabel = document.querySelector('label[for="search-input"]')
  if (searchLabel) searchLabel.textContent = strings.newtabSearchPlaceholder
  const button = document.querySelector('#search-form button')
  if (button) {
    button.setAttribute('title', strings.newtabSearchButton)
    button.setAttribute('aria-label', strings.newtabSearchButton)
  }
}

// Applies (and re-applies on language change) the page chrome from state.
function syncLanguage(state: PokechiState): void {
  const lang = state.settings?.language || 'en'
  if (lang === lastLabelsLang) return
  lastLabelsLang = lang
  document.documentElement.lang = lang
  applyLabels(getStrings(lang))
}

// Random showcase pokemon for the newtab header (idle sprite, random shiny).
const SHOWCASE_SHINY_CHANCE = 0.05
const SHOWCASE_BASE_SIZE = 64
let showcaseScale = 1

function getGenerationFolder(type: PokemonType): string {
  const data = POKEMON_DATA[type]
  if (data?.generation === PokemonGeneration.Gen2) return 'gen2'
  if (data?.generation === PokemonGeneration.Gen3) return 'gen3'
  if (data?.generation === PokemonGeneration.Gen4) return 'gen4'
  return 'gen1'
}

function showRandomPokemon(): void {
  const img = document.getElementById('showcase-sprite') as HTMLImageElement | null
  const nameEl = document.getElementById('showcase-name')
  if (!img || !nameEl) return

  const keys = Object.keys(POKEMON_DATA) as PokemonType[]
  const type = keys[Math.floor(Math.random() * keys.length)]
  const data = type ? POKEMON_DATA[type] : undefined
  if (!type || !data) return

  const shiny = Math.random() < SHOWCASE_SHINY_CHANCE
  const color = shiny ? 'shiny' : 'default'
  img.src = chrome.runtime.getURL(`media/${getGenerationFolder(type)}/${type}/${color}_idle_8fps.gif`)
  img.alt = data.name
  nameEl.textContent = shiny ? `${data.name} ★` : data.name
  nameEl.classList.toggle('is-shiny', shiny)
  img.title = getStrings(lastLabelsLang || 'en').newtabShowcaseTitle
  applyShowcaseScale()
}

// The showcase follows the same scale setting as the floating pet.
function applyShowcaseScale(): void {
  const img = document.getElementById('showcase-sprite') as HTMLImageElement | null
  if (!img) return
  const size = Math.round(SHOWCASE_BASE_SIZE * showcaseScale)
  img.style.width = `${size}px`
  img.style.height = `${size}px`
}

function initSearch(): void {
  document.getElementById('search-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const input = document.getElementById('search-input') as HTMLInputElement | null
    const query = input?.value.trim()
    if (!query) return
    try {
      const url = new URL(query)
      window.location.href = url.href
    } catch {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`
    }
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function loadTopSites(): Promise<void> {
  const container = document.getElementById('shortcuts')
  if (!container) return
  try {
    if (!chrome.topSites) return
    const faviconBase = chrome.runtime.getURL('/_favicon/')
    const sites = await chrome.topSites.get()
    container.innerHTML = sites
      .slice(0, 8)
      .map((site) => {
        let domain: string
        try {
          domain = new URL(site.url).hostname
        } catch {
          domain = site.url
        }
        const letter = escapeHtml((site.title || domain).charAt(0).toUpperCase())
        // Chrome's own favicon service: crisp at any size, works offline,
        // no third-party dependency.
        const iconSrc = `${faviconBase}?pageUrl=${encodeURIComponent(site.url)}&size=64`
        return `
          <a class="shortcut" href="${escapeHtml(site.url)}" title="${escapeHtml(site.title || site.url)}">
            <img src="${iconSrc}" alt="" loading="lazy" data-letter="${letter}">
            <span>${escapeHtml(site.title || domain)}</span>
          </a>
        `
      })
      .join('')
    // L9: fallback icon via a real listener instead of an inline onerror
    // attribute (no CSP-sensitive inline handlers, letter already in data-*).
    for (const img of container.querySelectorAll<HTMLImageElement>('img[data-letter]')) {
      img.addEventListener('error', () => {
        const span = document.createElement('span')
        span.className = 'fallback-icon'
        span.textContent = img.dataset.letter ?? '?'
        img.replaceWith(span)
      })
    }
  } catch {
    // topSites unavailable — page still works without shortcuts
  }
}

async function main(): Promise<void> {
  const res = await sendPokechiMessage({ type: 'GET_STATE' })
  if (res.success) {
    syncLanguage(res.state)
    lastCustomNewTab = res.state.settings?.customNewTab !== false
    if (!lastCustomNewTab) {
      // Neutral mode: no pet, no trackers, no custom content.
      document.body.classList.add('ntp-off')
      return
    }
    initFullExperience(res.state)
  } else {
    console.warn('[Pokechi] Could not fetch initial state in newtab:', res.error)
  }

  // R5: persistent state arrives via storage change; the transient XP
  // event (badge / temp bar / evolution FX) arrives as a coalesced message.
  subscribeToState((newState) => {
    syncLanguage(newState)
    const enabled = newState.settings?.customNewTab !== false
    if (enabled !== lastCustomNewTab) {
      // Mode flipped while the page is open — reload into the right one.
      window.location.reload()
      return
    }
    if (!enabled) return
    const scale = newState.settings?.scaleFactor || 1
    if (scale !== showcaseScale) {
      showcaseScale = scale
      applyShowcaseScale()
    }
    pet.updateState(newState)
  })

  chrome.runtime.onMessage.addListener((message) => {
    if (isXPEventMessage(message)) {
      pet.onXPEvent(message)
    } else if (isItemRevealEventMessage(message)) {
      pet.onItemRevealEvent(message)
    }
  })
}

function initFullExperience(state: PokechiState): void {
  initActivityTracker()
  initSearch()
  syncLanguage(state)
  showRandomPokemon()
  document.getElementById('showcase-sprite')?.addEventListener('click', showRandomPokemon)
  void loadTopSites()

  showcaseScale = state.settings?.scaleFactor || 1
  applyShowcaseScale()
  pet.init(state)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void main()
  })
} else {
  void main()
}
