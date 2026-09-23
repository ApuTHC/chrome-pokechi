import { PokechiState } from '../types'
import { POKEMON_DATA } from '../common/pokemon-data'
import { POKEMON_INFO_DATA } from '../common/pokemon-info-data'
import { POKEMON_INFO_DATA_ES } from '../common/pokemon-info-data.es'
import { ITEMS, ItemConfig } from '../common/items'
import { PokemonColor, PokemonElementType, PokemonGeneration, PokemonType } from '../common/types'
import { TYPE_BADGES } from '../common/type-badges'
import { getBadgeStatuses } from '../background/game-logic'

let state: PokechiState | null = null
let currentGenFilter = 'all'
let currentTypeFilter = 'all'
let currentBadgeGen = 1
let searchFilter = ''
let onlyDiscovered = false
let onlyShiny = false
let cardShinyState: Record<string, boolean> = {}

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

function padId(id: number): string {
  return String(id).padStart(3, '0')
}

function playCry(type: string, gen: PokemonGeneration): void {
  const folder = getGenerationFolder(gen)
  const audioUrl = chrome.runtime.getURL(`media/${folder}/${type}/cry.mp3`)
  const audio = new Audio(audioUrl)
  audio.volume = 0.7
  audio.play().catch(() => {})
}

function renderCounters(): void {
  if (!state) return
  document.getElementById('counter-discovered')!.textContent = `${state.pokedex.length}`
  document.getElementById('counter-shiny')!.textContent = `${state.shinyPokedex.length}`
  document.getElementById('counter-badges')!.textContent = `${state.badges.length}`
  document.getElementById('counter-total-xp')!.textContent = `${state.totalXP.toLocaleString()}`

  const candies = state.items['rare-candy'] || 0
  const bagSummary = document.getElementById('bag-summary-candies')
  if (bagSummary) {
    bagSummary.textContent = `${candies} Caramelos disponibles`
  }

  const badgesSummary = document.getElementById('badges-summary-count')
  if (badgesSummary) {
    badgesSummary.textContent = `${state.badges.length} / 32 obtenidas`
  }
}

function renderItems(): void {
  if (!state) return
  const container = document.getElementById('items-container')
  if (!container) return

  const itemKeys = Object.keys(ITEMS)
  container.innerHTML = itemKeys
    .map((itemId) => {
      const item: ItemConfig = ITEMS[itemId]
      const count = state!.items[itemId] || 0
      const sprite = chrome.runtime.getURL(`media/${item.spritePath}`)
      return `
        <div class="item-card">
          <div class="item-icon-wrapper">
            <img class="item-icon" src="${sprite}" alt="${item.name}">
          </div>
          <div class="item-name">${item.name}</div>
          <div class="item-count">x${count}</div>
          <button class="item-btn" data-item-id="${item.id}" ${count <= 0 ? 'disabled' : ''}>
            Usar
          </button>
        </div>
      `
    })
    .join('')

  container.querySelectorAll('.item-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.itemId
      if (!id) return
      const res = await chrome.runtime.sendMessage({ type: 'USE_ITEM', itemId: id })
      if (res && res.state) {
        state = res.state
        renderAll()
      }
    })
  })
}

function renderBadges(): void {
  if (!state) return
  const grid = document.getElementById('badges-grid')
  if (!grid) return

  const statuses = getBadgeStatuses(state)
  const filtered = statuses.filter((s) => s.badge.generation === currentBadgeGen)

  grid.innerHTML = filtered
    .map((s) => {
      const sprite = chrome.runtime.getURL(`media/${s.badge.spritePath}`)
      const reqs = s.requirements
        .map(
          (r) =>
            `<li class="${r.met ? 'met' : ''}">${r.met ? '✓' : '○'} ${r.label}: ${r.current}/${r.required}</li>`
        )
        .join('')

      return `
        <div class="badge-card ${s.earned ? 'is-earned' : 'is-locked'}">
          <div class="badge-img-wrapper">
            <img class="badge-img" src="${sprite}" alt="${s.badge.name}">
          </div>
          <div class="badge-name">${s.badge.name}</div>
          <ul class="badge-reqs">${reqs}</ul>
          <div class="badge-status-tag ${s.earned ? 'earned' : 'locked'}">
            ${s.earned ? '★ OBTENIDA' : '🔒 BLOQUEADA'}
          </div>
        </div>
      `
    })
    .join('')
}

function renderPokemonGrid(): void {
  if (!state) return
  const grid = document.getElementById('pokedex-grid')
  if (!grid) return

  const discoveredSet = new Set(state.pokedex)
  const shinySet = new Set(state.shinyPokedex)
  const currentPokemonType = state.pokemon?.type
  const pokeballUrl = chrome.runtime.getURL('media/pokeball.gif')

  const allEntries = Object.entries(POKEMON_DATA)
    .map(([type, data]) => ({ type: type as PokemonType, data }))
    .sort((a, b) => a.data.id - b.data.id)

  const filtered = allEntries.filter(({ type, data }) => {
    if (currentGenFilter !== 'all') {
      const genNum = parseInt(currentGenFilter, 10)
      if (data.generation !== genNum) return false
    }

    if (
      currentTypeFilter !== 'all' &&
      !data.types?.includes(currentTypeFilter as PokemonElementType)
    ) {
      return false
    }

    const isDiscovered = discoveredSet.has(type)
    if (onlyDiscovered && !isDiscovered) return false

    const hasShiny = shinySet.has(type)
    if (onlyShiny && !hasShiny) return false

    if (searchFilter) {
      const term = searchFilter.toLowerCase()
      const matchName = data.name.toLowerCase().includes(term)
      const matchId = String(data.id).includes(term)
      if (!matchName && !matchId) return false
    }

    return true
  })

  grid.innerHTML = filtered
    .map(({ type, data }) => {
      const isDiscovered = discoveredSet.has(type)
      const hasShiny = shinySet.has(type)
      const isShinyActive = !!cardShinyState[type] && hasShiny
      const isActive = type === currentPokemonType

      const genFolder = getGenerationFolder(data.generation)
      const rarityClass = data.rarity ? ` rarity-${data.rarity}` : ''
      const activeClass = isActive ? ' active' : ''

      // Locked card
      if (!isDiscovered) {
        return `
          <div class="pokemon-card-wrapper locked-wrapper" data-type="${type}">
            <div class="pokemon-card locked">
              <div class="card-top">
                <span class="pokemon-id">#${padId(data.id)}</span>
                <span class="gen-chip">${getGenerationLabel(data.generation)}</span>
              </div>
              <div class="sprite-frame">
                <img class="sprite" src="${pokeballUrl}" alt="???" loading="lazy">
              </div>
              <div class="pokemon-name">???</div>
              <div class="type-badges">
                <span class="type-badge" style="background:#1e293b; color:#475569;">???</span>
              </div>
            </div>
          </div>
        `
      }

      // Discovered card
      const color = isShinyActive ? 'shiny' : 'default'
      const spritePath = chrome.runtime.getURL(`media/${genFolder}/${type}/${color}_idle_8fps.gif`)

      const typeBadgesHtml = (data.types || [])
        .map((t) => {
          const badge = TYPE_BADGES[t]
          return badge ? `<span class="type-badge type-${t}">${badge.abbr}</span>` : ''
        })
        .join('')

      const shinyToggleBtn = hasShiny
        ? `<button class="ctrl-btn btn-shiny-toggle ${isShinyActive ? 'is-shiny-active' : ''}" data-type="${type}" title="Alternar Shiny">★</button>`
        : ''

      const info = POKEMON_INFO_DATA_ES[type] || POKEMON_INFO_DATA[type]
      const desc = info?.description || ''

      return `
        <div class="pokemon-card-wrapper" data-type="${type}" id="card-wrapper-${type}">
          <div class="card-controls">
            <button class="ctrl-btn btn-cry" data-type="${type}" data-gen="${data.generation}" title="Escuchar grito">🔊</button>
            ${shinyToggleBtn}
          </div>
          <button class="pokemon-card discovered${activeClass}${rarityClass}" data-type="${type}" id="card-${type}">
            <div class="card-top">
              <span class="pokemon-id">#${padId(data.id)}</span>
              ${isActive
                ? `<span class="active-badge">ACTIVO</span>`
                : `<span class="gen-chip">${getGenerationLabel(data.generation)}</span>`
              }
            </div>
            <div class="sprite-frame">
              <img
                class="sprite"
                src="${spritePath}"
                data-default="${chrome.runtime.getURL(`media/${genFolder}/${type}/default_idle_8fps.gif`)}"
                data-shiny="${hasShiny ? chrome.runtime.getURL(`media/${genFolder}/${type}/shiny_idle_8fps.gif`) : ''}"
                alt="${data.name}"
                loading="lazy"
              >
            </div>
            <div class="pokemon-name">${data.name}${isShinyActive ? ' ★' : ''}</div>
            <div class="type-badges">${typeBadgesHtml}</div>
            ${desc ? `<div class="card-desc">${desc}</div>` : ''}
          </button>
          <div class="card-footer">
            <button class="btn-select" data-type="${type}">✦ Elegir compañero</button>
          </div>
        </div>
      `
    })
    .join('')

  attachCardEvents()
}

function attachCardEvents(): void {
  // Play Cry
  document.querySelectorAll('.btn-cry').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const target = e.currentTarget as HTMLElement
      const type = target.dataset.type
      const gen = parseInt(target.dataset.gen || '1', 10) as PokemonGeneration
      if (type) playCry(type, gen)
    })
  })

  // Toggle Shiny
  document.querySelectorAll('.btn-shiny-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const type = (e.currentTarget as HTMLElement).dataset.type
      if (!type) return
      cardShinyState[type] = !cardShinyState[type]
      // Update sprite and name inline without full re-render
      const wrapper = document.getElementById(`card-wrapper-${type}`)
      const card = document.getElementById(`card-${type}`)
      const spriteEl = card?.querySelector('.sprite') as HTMLImageElement | null
      const nameEl = card?.querySelector('.pokemon-name')
      const shinyBtn = wrapper?.querySelector('.btn-shiny-toggle')
      if (!spriteEl) return

      const isShinyNow = cardShinyState[type]
      const data = POKEMON_DATA[type as PokemonType]
      const genFolder = getGenerationFolder(data?.generation ?? PokemonGeneration.Gen1)
      spriteEl.src = isShinyNow
        ? chrome.runtime.getURL(`media/${genFolder}/${type}/shiny_idle_8fps.gif`)
        : chrome.runtime.getURL(`media/${genFolder}/${type}/default_idle_8fps.gif`)
      if (nameEl) nameEl.textContent = `${data?.name || type}${isShinyNow ? ' ★' : ''}`
      shinyBtn?.classList.toggle('is-shiny-active', isShinyNow)
    })
  })

  // Select Companion
  document.querySelectorAll('.btn-select').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const type = (e.currentTarget as HTMLElement).dataset.type as PokemonType
      if (!type) return
      const color = cardShinyState[type] ? PokemonColor.shiny : PokemonColor.default
      const res = await chrome.runtime.sendMessage({
        type: 'SELECT_POKEMON',
        pokemonType: type,
        color,
      })
      if (res && res.success && res.state) {
        state = res.state
        alert(`¡Has seleccionado a ${POKEMON_DATA[type]?.name || type} como tu compañero!`)
        renderAll()
      }
    })
  })
}

function renderAll(): void {
  renderCounters()
  renderItems()
  renderBadges()
  renderPokemonGrid()
}

async function init(): Promise<void> {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_STATE' })
    if (res && res.success && res.state) {
      state = res.state
      renderAll()
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

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    searchFilter = (e.target as HTMLInputElement).value
    renderPokemonGrid()
  })

  document.querySelectorAll('.gen-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.gen-btn').forEach((b) => b.classList.remove('active'))
      const target = e.currentTarget as HTMLElement
      target.classList.add('active')
      currentGenFilter = target.dataset.gen || 'all'
      renderPokemonGrid()
    })
  })

  document.getElementById('filter-type')?.addEventListener('change', (e) => {
    currentTypeFilter = (e.target as HTMLSelectElement).value
    renderPokemonGrid()
  })

  document.getElementById('filter-discovered')?.addEventListener('change', (e) => {
    onlyDiscovered = (e.target as HTMLInputElement).checked
    renderPokemonGrid()
  })

  document.getElementById('filter-shiny')?.addEventListener('change', (e) => {
    onlyShiny = (e.target as HTMLInputElement).checked
    renderPokemonGrid()
  })

  document.querySelectorAll('.badge-tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.badge-tab-btn').forEach((b) => b.classList.remove('active'))
      const target = e.currentTarget as HTMLElement
      target.classList.add('active')
      currentBadgeGen = parseInt(target.dataset.gen || '1', 10)
      renderBadges()
    })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  void init()
})
