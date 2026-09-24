import { PokechiState } from '../types'
import { POKEMON_DATA } from '../common/pokemon-data'
import { POKEMON_INFO_DATA, PokemonInfoEntry } from '../common/pokemon-info-data'
import { POKEMON_INFO_DATA_ES } from '../common/pokemon-info-data.es'
import { ITEMS, ItemConfig } from '../common/items'
import { PokemonColor, PokemonElementType, PokemonGeneration, PokemonType } from '../common/types'
import { TYPE_BADGES } from '../common/type-badges'
import { canUseRareCandy, getBadgeStatuses } from '../background/game-logic'
import { getStrings } from '../common/i18n'
import {
  SPARKLE_ICON,
  SOUND_ICON,
  INFO_ICON,
  ATTACK_ICON,
  getSparkleBurstMarkup,
  getSparkleBurstCssRules,
  getSoundWaveMarkup,
  getSoundWaveCssRules,
} from '../common/icons'

let state: PokechiState | null = null
let generationFilter = 'all'
let selectedTypes: Record<string, boolean> = {}
let onlyDiscovered = false
let onlyShiny = false
// Snapshot of everything the grid depends on — re-render it only when one of
// these actually changes, so plain XP ticks don't rebuild 500+ sprites.
let lastGridSnapshot = ''

interface PokedexEntry {
  type: PokemonType
  id: number
  name: string
  generation: PokemonGeneration
}

const POKEDEX_ENTRIES: PokedexEntry[] = Object.keys(POKEMON_DATA)
  .map((type) => {
    const data = POKEMON_DATA[type as PokemonType]
    return {
      type: type as PokemonType,
      id: data.id,
      name: data.name,
      generation: data.generation,
    }
  })
  .sort((a, b) => a.id - b.id)

// Cards are addressed by their position in the grid rather than by species,
// so the markup of a locked card gives nothing away.
const POKEDEX_INDEX_BY_TYPE: { [type: string]: number } = {}
POKEDEX_ENTRIES.forEach((entry, index) => {
  POKEDEX_INDEX_BY_TYPE[entry.type] = index
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function padPokemonId(id: number): string {
  const text = String(id)
  return text.length >= 3 ? text : `000${text}`.slice(-3)
}

function getGenerationFolder(gen: PokemonGeneration): string {
  if (gen === PokemonGeneration.Gen2) return 'gen2'
  if (gen === PokemonGeneration.Gen3) return 'gen3'
  if (gen === PokemonGeneration.Gen4) return 'gen4'
  return 'gen1'
}

function getGenerationLabel(gen: PokemonGeneration): string {
  if (gen === PokemonGeneration.Gen2) return 'Johto'
  if (gen === PokemonGeneration.Gen3) return 'Hoenn'
  if (gen === PokemonGeneration.Gen4) return 'Sinnoh'
  return 'Kanto'
}

function getSpritePath(type: PokemonType, color: PokemonColor): string {
  const data = POKEMON_DATA[type]
  if (!data) return 'pokeball.gif'
  const colorPrefix = color === PokemonColor.shiny ? 'shiny' : 'default'
  return `${getGenerationFolder(data.generation)}/${type}/${colorPrefix}_idle_8fps.gif`
}

function getCryPath(type: PokemonType): string {
  const data = POKEMON_DATA[type]
  if (!data) return ''
  return `${getGenerationFolder(data.generation)}/${type}/cry.mp3`
}

const ABBREVIATION_UNITS = ['', 'K', 'M', 'G', 'T', 'P']

function formatAbbreviatedNumber(value: number): string {
  let scaled = value
  let unitIndex = 0
  while (Math.abs(scaled) >= 1000 && unitIndex < ABBREVIATION_UNITS.length - 1) {
    scaled /= 1000
    unitIndex++
  }
  if (unitIndex === 0) return String(Math.round(scaled))
  const decimals = Math.abs(scaled) < 10 ? 2 : Math.abs(scaled) < 100 ? 1 : 0
  return scaled.toFixed(decimals) + ABBREVIATION_UNITS[unitIndex]
}

function playCrySrc(crySrc: string): void {
  const audio = new Audio(crySrc)
  audio.volume = 0.7
  audio.play().catch(() => {})
}

function renderTypeBadges(types: PokemonElementType[] | undefined): string {
  if (!types || types.length === 0) return ''
  return types
    .map((t) => {
      const badge = TYPE_BADGES[t]
      return badge ? `<span class="type-badge type-${t}">${badge.abbr}</span>` : ''
    })
    .join('')
}

function getInfo(type: PokemonType): PokemonInfoEntry | undefined {
  return POKEMON_INFO_DATA_ES[type] || POKEMON_INFO_DATA[type]
}

function renderCounters(): void {
  if (!state) return
  const total = POKEDEX_ENTRIES.length
  document.getElementById('counter-value')!.textContent = `${state.pokedex.length}/${total}`
  document.getElementById('shiny-counter-value')!.textContent = `${state.shinyPokedex.length}/${total}`
  const statuses = getBadgeStatuses(state, getStrings('es'))
  const earned = statuses.filter((s) => s.earned).length
  document.getElementById('badge-counter-value')!.textContent = `${earned}/${statuses.length}`
  document.getElementById('total-xp-value')!.textContent = formatAbbreviatedNumber(state.totalXP || 0)

  // Candy counter button in the header
  const candyCount = state.items['rare-candy'] || 0
  const usable = canUseRareCandy(state.pokemon) && candyCount > 0
  const btn = document.getElementById('candy-counter') as HTMLButtonElement | null
  const icon = document.getElementById('candy-counter-icon') as HTMLImageElement | null
  const val = document.getElementById('candy-counter-value')
  const label = document.getElementById('candy-counter-label')
  if (btn && icon && val && label) {
    icon.src = chrome.runtime.getURL(`media/${ITEMS['rare-candy'].spritePath}`)
    val.textContent = `${candyCount}`
    label.textContent = ITEMS['rare-candy'].name
    btn.disabled = !usable
    btn.title =
      candyCount === 0
        ? `Aún no tienes ${ITEMS['rare-candy'].name}`
        : usable
          ? ITEMS['rare-candy'].description
          : `${ITEMS['rare-candy'].name}: no se puede usar ahora`
  }
}

function canUseMasterBall(): boolean {
  if (!state) return false
  const discovered = new Set(state.pokedex)
  return Object.entries(POKEMON_DATA).some(
    ([type, data]) => data.rarity !== undefined && !discovered.has(type as PokemonType)
  )
}

function canUsePremierBall(): boolean {
  if (!state) return false
  const shiny = new Set(state.shinyPokedex)
  return Object.keys(POKEMON_DATA).some((type) => !shiny.has(type as PokemonType))
}

function itemUsable(itemId: string): boolean {
  if (!state) return false
  const count = state.items[itemId] || 0
  if (count <= 0) return false
  if (itemId === 'rare-candy') return canUseRareCandy(state.pokemon)
  if (itemId === 'master-ball') return canUseMasterBall()
  if (itemId === 'premier-ball') return canUsePremierBall()
  return true
}

function renderItems(): void {
  if (!state) return
  const container = document.getElementById('items-container')
  if (!container) return

  container.innerHTML = Object.keys(ITEMS)
    .map((itemId) => {
      const item: ItemConfig = ITEMS[itemId]
      const count = state!.items[itemId] || 0
      const usable = itemUsable(itemId)
      const sprite = chrome.runtime.getURL(`media/${item.spritePath}`)
      return `
        <div class="item-card">
          <div class="item-card-name">${escapeHtml(item.name)}</div>
          <img class="item-card-icon" src="${sprite}" alt="">
          <div class="item-card-count" data-item-count="${item.id}">x${count}</div>
          <div class="item-card-actions">
            <p class="item-card-description">${escapeHtml(item.description)}</p>
            <button type="button" class="item-card-use-button" data-use-item="${item.id}" ${usable ? '' : 'disabled'}>Usar</button>
          </div>
        </div>
      `
    })
    .join('')
}

function renderBadges(): void {
  if (!state) return
  const wrapper = document.getElementById('badge-row-wrapper')
  if (!wrapper) return

  const statuses = getBadgeStatuses(state, getStrings('es'))
  const byGeneration = new Map<PokemonGeneration, typeof statuses>()
  for (const status of statuses) {
    const list = byGeneration.get(status.badge.generation) ?? []
    list.push(status)
    byGeneration.set(status.badge.generation, list)
  }

  const gens = [PokemonGeneration.Gen1, PokemonGeneration.Gen2, PokemonGeneration.Gen3, PokemonGeneration.Gen4]
  wrapper.innerHTML = gens
    .map((gen, index) => {
      const list = (byGeneration.get(gen) ?? []).slice().sort((a, b) => a.badge.order - b.badge.order)
      const cards = list
        .map((status) => {
          const sprite = chrome.runtime.getURL(`media/${status.badge.spritePath}`)
          const reqs = status.requirements
            .map((r) => `<li class="badge-requirement${r.met ? ' is-met' : ''}">${escapeHtml(r.label)}: ${r.current}/${r.required}</li>`)
            .join('')
          return `
            <div class="badge-card ${status.earned ? 'is-earned' : 'is-locked'}">
              <div class="badge-card-name">${escapeHtml(status.badge.name)}</div>
              <img class="badge-card-image" src="${sprite}" alt="">
              <ul class="badge-card-requirements">${reqs}</ul>
              <div class="badge-card-status">${status.earned ? 'Obtenida' : 'Bloqueada'}</div>
            </div>
          `
        })
        .join('')
      return `<div class="badge-row" data-badge-gen-row="${gen}" ${index === 0 ? '' : 'hidden'}>${cards}</div>`
    })
    .join('')
}

const STAT_LABELS: Array<[keyof PokemonInfoEntry['stats'], string]> = [
  ['hp', 'HP'],
  ['attack', 'ATK'],
  ['defense', 'DEF'],
  ['specialAttack', 'SPA'],
  ['specialDefense', 'SPD'],
  ['speed', 'SPE'],
]

function renderCardBack(type: PokemonType, name: string): string {
  const info = getInfo(type)
  if (!info) return ''
  const statsHtml = STAT_LABELS.map(
    ([key, label]) =>
      `<li><span class="back-stat-label">${label}</span><span class="back-stat-value">${info.stats[key]}</span></li>`
  ).join('')
  const movesHtml = info.moves
    .map(
      (move) => `
        <li class="back-move">
          <div class="back-move-header">
            <span class="back-move-name-group">
              ${renderTypeBadges([move.type])}
              <span class="back-move-name">${escapeHtml(move.name)}</span>
            </span>
            <span class="back-move-power">${move.power === null ? '-' : move.power}</span>
          </div>
          <p class="back-move-description">${escapeHtml(move.description)}</p>
        </li>
      `
    )
    .join('')
  return `
    <div class="card-face card-face-back">
      <div class="back-panel back-panel-info" data-back-panel="info">
        <p class="back-flavor">${escapeHtml(info.flavorText)}</p>
        <ul class="back-stats">${statsHtml}</ul>
      </div>
      <div class="back-panel back-panel-moves" data-back-panel="moves" hidden>
        <ul class="back-moves">${movesHtml}</ul>
      </div>
      <div class="back-footer-name">${escapeHtml(name)}</div>
    </div>
  `
}

function computeGridSnapshot(): string {
  if (!state) return ''
  const active = state.pokemon && state.pokemon.level > 0 ? state.pokemon : undefined
  return JSON.stringify({
    d: [...state.pokedex].sort(),
    s: [...state.shinyPokedex].sort(),
    a: active?.type,
    c: active?.color,
  })
}

function renderPokemonGrid(): void {
  if (!state) return
  const grid = document.getElementById('pokedex-grid')
  if (!grid) return

  const discoveredSet = new Set(state.pokedex)
  const shinySet = new Set(state.shinyPokedex)
  const active = state.pokemon && state.pokemon.level > 0 ? state.pokemon : undefined
  const lockedSprite = chrome.runtime.getURL('media/pokeball.gif')

  grid.innerHTML = POKEDEX_ENTRIES.map((entry, index) => {
    const discovered = discoveredSet.has(entry.type)
    const isShiny = discovered && shinySet.has(entry.type)
    const isActive = active?.type === entry.type
    // The active card opens showing the sprite it is actually displayed as.
    const showsShinyByDefault = !!isActive && !!isShiny && active?.color === PokemonColor.shiny

    if (!discovered) {
      return `
        <div class="pokemon-card-wrapper">
          <div class="card-flip">
            <div class="card-flip-inner">
              <button
                type="button"
                class="pokemon-card locked"
                data-index="${index}"
                data-generation="${entry.generation}"
                data-name=""
                data-number="${padPokemonId(entry.id)}"
                data-has-shiny="0"
                data-types=""
                disabled
                aria-pressed="false"
                aria-label="Sin descubrir"
              >
                <div class="card-top">
                  <span class="pokemon-id">#${padPokemonId(entry.id)}</span>
                  <span class="generation-chip">${getGenerationLabel(entry.generation)}</span>
                  <span class="active-badge">ACTIVO</span>
                </div>
                <div class="sprite-frame">
                  <img class="sprite" src="${lockedSprite}" alt="" loading="lazy" />
                  <div class="sparkle-burst">${getSparkleBurstMarkup()}</div>
                  <div class="sound-wave-burst">${getSoundWaveMarkup()}</div>
                </div>
                <div class="pokemon-name">???</div>
                <div class="type-badges"></div>
              </button>
            </div>
          </div>
        </div>
      `
    }

    const data = POKEMON_DATA[entry.type]
    const defaultSprite = chrome.runtime.getURL(`media/${getSpritePath(entry.type, PokemonColor.default)}`)
    const shinySprite = isShiny ? chrome.runtime.getURL(`media/${getSpritePath(entry.type, PokemonColor.shiny)}`) : ''
    const initialSprite = showsShinyByDefault ? shinySprite : defaultSprite
    const rarity = data?.rarity
    const rarityClass = rarity ? ` rarity-${rarity}` : ''
    const typesAttr = (data?.types ?? []).join(' ')
    const cryUri = chrome.runtime.getURL(`media/${getCryPath(entry.type)}`)
    const tooltip = data?.cry ? ` title="${escapeHtml(data.cry)}"` : ''

    const shinyToggle = isShiny
      ? `<button type="button" class="shiny-toggle${showsShinyByDefault ? ' is-shiny-active' : ''}" data-shiny-toggle aria-label="Alternar shiny de ${escapeHtml(entry.name)}" aria-pressed="${showsShinyByDefault ? 'true' : 'false'}" title="Alternar Shiny">${SPARKLE_ICON}</button>`
      : ''
    const cardBack = renderCardBack(entry.type, entry.name)

    return `
      <div class="pokemon-card-wrapper">
        <div class="card-flip">
          <div class="card-flip-inner">
            <button
              type="button"
              class="pokemon-card discovered${isActive ? ' active' : ''}${rarityClass}"
              data-index="${index}"
              data-generation="${entry.generation}"
              data-name="${escapeHtml(entry.name.toLowerCase())}"
              data-number="${padPokemonId(entry.id)}"
              data-has-shiny="${isShiny ? '1' : '0'}"
              data-types="${typesAttr}"
              data-pokemon-type="${entry.type}"
              aria-pressed="${isActive ? 'true' : 'false'}"
              aria-label="${escapeHtml(isActive ? `${entry.name} (activo)` : entry.name)}"${tooltip}
            >
              <div class="card-top">
                <span class="pokemon-id">#${padPokemonId(entry.id)}</span>
                <span class="generation-chip">${getGenerationLabel(entry.generation)}</span>
                <span class="active-badge">ACTIVO</span>
              </div>
              <div class="sprite-frame">
                <img
                  class="sprite"
                  src="${initialSprite}"
                  data-default-sprite="${defaultSprite}"
                  data-shiny-sprite="${shinySprite}"
                  data-showing-shiny="${showsShinyByDefault ? '1' : '0'}"
                  alt=""
                  loading="lazy"
                />
                <div class="sparkle-burst">${getSparkleBurstMarkup()}</div>
                <div class="sound-wave-burst">${getSoundWaveMarkup()}</div>
              </div>
              <div class="pokemon-name">${escapeHtml(entry.name)}</div>
              <div class="type-badges">${renderTypeBadges(data?.types)}</div>
            </button>
            ${cardBack}
          </div>
        </div>
        <div class="card-controls">
          <button type="button" class="play-cry-button" data-play-cry="${entry.type}" data-cry-src="${cryUri}" aria-label="Escuchar grito de ${escapeHtml(entry.name)}" title="Escuchar grito">${SOUND_ICON}</button>
          ${shinyToggle}
        </div>
        <button type="button" class="face-toggle face-toggle-info" data-flip-target="info" aria-label="Ver info de ${escapeHtml(entry.name)}" aria-pressed="false" title="Info">${INFO_ICON}</button>
        <button type="button" class="face-toggle face-toggle-moves" data-flip-target="moves" aria-label="Ver movimientos de ${escapeHtml(entry.name)}" aria-pressed="false" title="Movimientos">${ATTACK_ICON}</button>
      </div>
    `
  }).join('')

  lastGridSnapshot = computeGridSnapshot()
  applyFilters()
}

function renderAll(): void {
  applyPetScale()
  renderCounters()
  renderItems()
  renderBadges()
  if (computeGridSnapshot() !== lastGridSnapshot) {
    renderPokemonGrid()
  }
}

// The pet scale setting also sizes the Pokedex sprites, via a CSS variable
// on the grid — a settings-only change needs no grid re-render to apply.
function applyPetScale(): void {
  const grid = document.getElementById('pokedex-grid')
  const scale = state?.settings?.scaleFactor || 1
  grid?.style.setProperty('--pet-scale', `${scale}`)
}

// ---------- Filtering (client-side, no re-render) ----------

function applyFilters(): void {
  const grid = document.getElementById('pokedex-grid')
  const emptyState = document.getElementById('empty-state')
  const search = document.getElementById('search') as HTMLInputElement | null
  if (!grid) return

  const term = (search?.value || '').trim().toLowerCase()
  const wrappers = grid.querySelectorAll('.pokemon-card-wrapper')
  let visible = 0
  const hasSelectedTypes = Object.keys(selectedTypes).some((t) => selectedTypes[t])

  wrappers.forEach((wrapper) => {
    const card = wrapper.querySelector('.pokemon-card') as HTMLElement | null
    if (!card) return
    const dataset = (card as HTMLElement).dataset

    const matchesGeneration = generationFilter === 'all' || dataset.generation === generationFilter
    const matchesDiscovered = !onlyDiscovered || card.classList.contains('discovered')
    const matchesShiny = !onlyShiny || dataset.hasShiny === '1'
    // Undiscovered cards have no name to match on, so a search only ever
    // narrows down to what the user has already met.
    const matchesTerm =
      !term ||
      (dataset.name !== undefined && dataset.name !== '' && dataset.name.indexOf(term) >= 0) ||
      (dataset.number !== undefined && dataset.number.indexOf(term) >= 0)
    // Same reasoning for types: a locked card has no data-types, so the
    // type filter only narrows down discovered cards instead of hiding a
    // locked one and giving away whether it matches.
    const cardTypes = dataset.types ? dataset.types.split(' ') : []
    const matchesTypes =
      !hasSelectedTypes || cardTypes.length === 0 || cardTypes.some((t) => selectedTypes[t])

    const show = matchesGeneration && matchesDiscovered && matchesShiny && matchesTerm && matchesTypes
    ;(wrapper as HTMLElement).hidden = !show
    if (show) visible++
  })

  if (emptyState) emptyState.hidden = visible > 0
}

function resetFilters(): void {
  generationFilter = 'all'
  document.querySelectorAll('.filter-chip[data-generation]').forEach((chip) => {
    chip.classList.toggle('is-selected', (chip as HTMLElement).dataset.generation === 'all')
  })
  const search = document.getElementById('search') as HTMLInputElement | null
  if (search) search.value = ''
  const disc = document.getElementById('only-discovered') as HTMLInputElement | null
  if (disc) disc.checked = false
  onlyDiscovered = false
  const shiny = document.getElementById('only-shiny') as HTMLInputElement | null
  if (shiny) shiny.checked = false
  onlyShiny = false
  selectedTypes = {}
  document.querySelectorAll('#type-filter-menu [data-type-option]').forEach((cb) => {
    ;(cb as HTMLInputElement).checked = false
  })
  updateTypeFilterButton()
  applyFilters()
}

// ---------- Card interactions ----------

function playBurst(wrapper: Element | null, selector: string): void {
  const burst = wrapper?.querySelector(selector) as HTMLElement | null
  if (!burst) return
  burst.classList.remove('is-active')
  void burst.offsetWidth
  burst.classList.add('is-active')
  window.setTimeout(() => burst.classList.remove('is-active'), 1000)
}

function toggleShinySprite(toggle: HTMLElement): void {
  const wrapper = toggle.closest('.pokemon-card-wrapper')
  const sprite = wrapper?.querySelector('.sprite') as HTMLImageElement | null
  if (!sprite) return
  const showingShiny = sprite.dataset.showingShiny === '1'
  const nextSrc = showingShiny ? sprite.dataset.defaultSprite : sprite.dataset.shinySprite
  if (!nextSrc) return
  sprite.src = nextSrc
  sprite.dataset.showingShiny = showingShiny ? '0' : '1'
  toggle.classList.toggle('is-shiny-active', !showingShiny)
  toggle.setAttribute('aria-pressed', showingShiny ? 'false' : 'true')
  if (!showingShiny) playBurst(wrapper, '.sparkle-burst')
}

function toggleCardFace(button: HTMLElement): void {
  const wrapper = button.closest('.pokemon-card-wrapper')
  const flip = wrapper?.querySelector('.card-flip')
  if (!flip) return
  const target = button.dataset.flipTarget
  const isFlipped = flip.classList.contains('is-flipped')
  const currentPanel = flip.querySelector('.back-panel:not([hidden])') as HTMLElement | null
  const currentTarget = currentPanel?.dataset.backPanel

  if (isFlipped && currentTarget === target) {
    flip.classList.remove('is-flipped')
  } else {
    flip.querySelectorAll('.back-panel').forEach((panel) => {
      ;(panel as HTMLElement).hidden = (panel as HTMLElement).dataset.backPanel !== target
    })
    flip.classList.add('is-flipped')
  }

  const stillFlipped = flip.classList.contains('is-flipped')
  const activePanel = stillFlipped ? flip.querySelector('.back-panel:not([hidden])') as HTMLElement | null : null
  const activeTarget = activePanel?.dataset.backPanel
  wrapper?.querySelectorAll('[data-flip-target]').forEach((btn) => {
    btn.setAttribute('aria-pressed', (btn as HTMLElement).dataset.flipTarget === activeTarget ? 'true' : 'false')
  })
}

function syncShinyState(card: Element, isShiny: boolean): void {
  const wrapper = card.closest('.pokemon-card-wrapper')
  const sprite = card.querySelector('.sprite') as HTMLImageElement | null
  const toggle = wrapper?.querySelector('[data-shiny-toggle]')
  if (!sprite) return
  const targetSrc = isShiny ? sprite.dataset.shinySprite : sprite.dataset.defaultSprite
  if (targetSrc) sprite.src = targetSrc
  sprite.dataset.showingShiny = isShiny ? '1' : '0'
  if (toggle) {
    toggle.classList.toggle('is-shiny-active', isShiny)
    toggle.setAttribute('aria-pressed', isShiny ? 'true' : 'false')
  }
}

async function selectCompanion(type: PokemonType, isShiny: boolean): Promise<void> {
  const res = await chrome.runtime.sendMessage({
    type: 'SELECT_POKEMON',
    pokemonType: type,
    color: isShiny ? PokemonColor.shiny : PokemonColor.default,
  })
  if (res && res.success && res.state) {
    state = res.state
    renderAll()
  }
}

// Scrolls to and briefly highlights a card, clearing whatever filters would
// otherwise hide it — used by the "DEX" button on the pet's XP bar.
function locatePokemon(pokemonType: string, isShiny: boolean): void {
  const grid = document.getElementById('pokedex-grid')
  if (!grid) return
  const target = grid.querySelector(`[data-pokemon-type="${pokemonType}"]`)
  if (!target) return

  const card = target as HTMLElement
  const wrapper = card.closest('.pokemon-card-wrapper') as HTMLElement | null
  if (wrapper?.hidden) {
    resetFilters()
  }

  const data = POKEMON_DATA[pokemonType as PokemonType]
  if (data && shinyAvailable(pokemonType)) {
    syncShinyState(card, isShiny)
  }

  card.scrollIntoView({ behavior: 'smooth', block: 'center' })
  card.classList.add('locate-highlight')
  window.setTimeout(() => card.classList.remove('locate-highlight'), 2500)
}

function shinyAvailable(type: string): boolean {
  return !!state && state.shinyPokedex.includes(type as PokemonType)
}

function handleHash(): void {
  const hash = window.location.hash
  if (!hash.startsWith('#locate=')) return
  const params = new URLSearchParams(hash.slice(1))
  const type = params.get('locate')
  if (!type || POKEDEX_INDEX_BY_TYPE[type] === undefined) return
  locatePokemon(type, params.get('shiny') === '1')
}

async function useItem(itemId: string): Promise<void> {
  const res = await chrome.runtime.sendMessage({ type: 'USE_ITEM', itemId })
  if (res && res.state) {
    state = res.state
    renderAll()
  }
}

function buildTypeFilterMenu(): void {
  const menu = document.getElementById('type-filter-menu')
  if (!menu) return
  menu.innerHTML =
    Object.keys(TYPE_BADGES)
      .map((type) => {
        const badge = TYPE_BADGES[type as PokemonElementType]
        return `
          <label class="type-filter-option">
            <span class="type-badge type-${type}">${badge.abbr}</span>
            <input type="checkbox" data-type-option value="${type}" />
          </label>
        `
      })
      .join('') + `<button type="button" class="type-filter-clear" id="type-filter-clear">Limpiar</button>`

  menu.querySelectorAll('[data-type-option]').forEach((cb) => {
    cb.addEventListener('change', () => {
      selectedTypes[(cb as HTMLInputElement).value] = (cb as HTMLInputElement).checked
      updateTypeFilterButton()
      applyFilters()
    })
  })
  document.getElementById('type-filter-clear')?.addEventListener('click', (e) => {
    e.stopPropagation()
    selectedTypes = {}
    menu.querySelectorAll('[data-type-option]').forEach((cb) => {
      ;(cb as HTMLInputElement).checked = false
    })
    updateTypeFilterButton()
    applyFilters()
  })
}

function updateTypeFilterButton(): void {
  const selected = Object.keys(selectedTypes).filter((t) => selectedTypes[t])
  const toggle = document.getElementById('type-filter-toggle')
  const count = document.getElementById('type-filter-count')
  if (toggle) toggle.classList.toggle('is-selected', selected.length > 0)
  if (count) {
    count.hidden = selected.length === 0
    count.textContent = selected.length ? ` (${selected.length})` : ''
  }
}

async function init(): Promise<void> {
  // Effect styles (sparkle / sound-wave bursts) live with their markup
  // helpers so both stay in sync.
  const effectStyle = document.createElement('style')
  effectStyle.textContent = getSparkleBurstCssRules() + '\n' + getSoundWaveCssRules()
  document.head.appendChild(effectStyle)

  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_STATE' })
    if (res && res.success && res.state) {
      state = res.state
      renderAll()
      handleHash()
    }
  } catch (e) {
    console.error('Could not load state in Pokedex:', e)
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === 'POKECHI_STATE_UPDATED' && msg.state) {
      state = msg.state
      renderAll()
    }
  })

  window.addEventListener('hashchange', handleHash)

  // Filters
  document.getElementById('search')?.addEventListener('input', applyFilters)
  document.querySelectorAll('.filter-chip[data-generation]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-generation]').forEach((b) => b.classList.remove('is-selected'))
      chip.classList.add('is-selected')
      generationFilter = (chip as HTMLElement).dataset.generation || 'all'
      applyFilters()
    })
  })
  document.getElementById('only-discovered')?.addEventListener('change', (e) => {
    onlyDiscovered = (e.target as HTMLInputElement).checked
    applyFilters()
  })
  document.getElementById('only-shiny')?.addEventListener('change', (e) => {
    onlyShiny = (e.target as HTMLInputElement).checked
    applyFilters()
  })

  const typeToggle = document.getElementById('type-filter-toggle')
  const typeMenu = document.getElementById('type-filter-menu')
  buildTypeFilterMenu()
  typeToggle?.addEventListener('click', (e) => {
    e.stopPropagation()
    if (!typeMenu) return
    const open = typeMenu.hidden
    typeMenu.hidden = !open
    typeToggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  })
  typeMenu?.addEventListener('click', (e) => e.stopPropagation())
  document.addEventListener('click', (e) => {
    if (typeMenu && !typeMenu.hidden && !(e.target as HTMLElement).closest('.type-filter')) {
      typeMenu.hidden = true
      typeToggle?.setAttribute('aria-expanded', 'false')
    }
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && typeMenu && !typeMenu.hidden) {
      typeMenu.hidden = true
      typeToggle?.setAttribute('aria-expanded', 'false')
    }
  })

  // Bag accordion + tabs
  const bagToggle = document.getElementById('bag-toggle')
  const bagContent = document.getElementById('bag-content')
  bagToggle?.addEventListener('click', () => {
    if (!bagContent || !bagToggle) return
    const open = bagContent.hidden
    bagContent.hidden = !open
    bagToggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  })
  document.querySelectorAll('[data-bag-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = (tab as HTMLElement).dataset.bagTab
      document.querySelectorAll('[data-bag-tab]').forEach((other) => {
        const isTarget = other === tab
        other.classList.toggle('is-selected', isTarget)
        other.setAttribute('aria-selected', isTarget ? 'true' : 'false')
      })
      document.querySelectorAll('[data-bag-tabpanel]').forEach((panel) => {
        ;(panel as HTMLElement).hidden = (panel as HTMLElement).dataset.bagTabpanel !== target
      })
    })
  })
  document.querySelectorAll('#badge-gen-tabs [data-badge-gen]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = (tab as HTMLElement).dataset.badgeGen
      document.querySelectorAll('#badge-gen-tabs [data-badge-gen]').forEach((other) => {
        const isTarget = other === tab
        other.classList.toggle('is-selected', isTarget)
        other.setAttribute('aria-selected', isTarget ? 'true' : 'false')
      })
      document.querySelectorAll('#badge-row-wrapper [data-badge-gen-row]').forEach((row) => {
        ;(row as HTMLElement).hidden = (row as HTMLElement).dataset.badgeGenRow !== target
      })
    })
  })

  // Grid interactions (delegated — survives re-renders)
  const grid = document.getElementById('pokedex-grid')
  grid?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    const cryBtn = target.closest('[data-play-cry]')
    if (cryBtn) {
      e.stopPropagation()
      const src = (cryBtn as HTMLElement).dataset.crySrc
      if (src) playCrySrc(src)
      playBurst(cryBtn.closest('.pokemon-card-wrapper'), '.sound-wave-burst')
      return
    }

    const faceToggle = target.closest('[data-flip-target]')
    if (faceToggle) {
      e.stopPropagation()
      toggleCardFace(faceToggle as HTMLElement)
      return
    }

    const shinyToggle = target.closest('[data-shiny-toggle]')
    if (shinyToggle) {
      e.stopPropagation()
      toggleShinySprite(shinyToggle as HTMLElement)
      return
    }

    const card = target.closest('.pokemon-card') as HTMLElement | null
    if (!card || (card as HTMLButtonElement).disabled) return
    const type = card.dataset.pokemonType as PokemonType | undefined
    if (!type) return
    const sprite = card.querySelector('.sprite') as HTMLImageElement | null
    const isShiny = !!sprite && sprite.dataset.showingShiny === '1'
    if (state?.settings?.soundEnabled !== false) {
      playCrySrc(chrome.runtime.getURL(`media/${getCryPath(type)}`))
      playBurst(card.closest('.pokemon-card-wrapper'), '.sound-wave-burst')
    }
    void selectCompanion(type, isShiny)
  })

  // Items (delegated)
  document.getElementById('items-container')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-use-item]') as HTMLButtonElement | null
    if (!btn || btn.disabled) return
    void useItem(btn.dataset.useItem || '')
  })

  // Header candy shortcut
  document.getElementById('candy-counter')?.addEventListener('click', (e) => {
    if ((e.currentTarget as HTMLButtonElement).disabled) return
    void useItem('rare-candy')
  })
}

document.addEventListener('DOMContentLoaded', () => {
  void init()
})
