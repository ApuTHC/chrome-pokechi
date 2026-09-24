import { PokechiState, UserPokemon } from '../types'
import { POKEMON_DATA } from '../common/pokemon-data'
import { PokemonColor, PokemonGeneration } from '../common/types'
import { TYPE_BADGES } from '../common/type-badges'
import { getRequiredXPForLevel } from '../background/game-logic'

let currentState: PokechiState | null = null

function getSpritePath(pokemon: UserPokemon): string {
  if (pokemon.level === 0) {
    return 'media/pokeball.gif'
  }
  const data = POKEMON_DATA[pokemon.type]
  let gen = 'gen1'
  if (data?.generation === PokemonGeneration.Gen2) gen = 'gen2'
  else if (data?.generation === PokemonGeneration.Gen3) gen = 'gen3'
  else if (data?.generation === PokemonGeneration.Gen4) gen = 'gen4'

  const color = pokemon.color === PokemonColor.shiny ? 'shiny' : 'default'
  return `media/${gen}/${pokemon.type}/${color}_idle_8fps.gif`
}

function updateUI(state: PokechiState): void {
  currentState = state
  const pokemon = state.pokemon
  if (!pokemon) return

  // 1. Sprite & Info
  const spriteEl = document.getElementById('popup-sprite') as HTMLImageElement
  const nameEl = document.getElementById('popup-name')
  const levelEl = document.getElementById('popup-level')
  const typesEl = document.getElementById('popup-types')
  const xpBarEl = document.getElementById('popup-xp-bar')
  const xpTextEl = document.getElementById('popup-xp-text')

  if (spriteEl) {
    spriteEl.src = chrome.runtime.getURL(getSpritePath(pokemon))
    const scale = state.settings?.scaleFactor || 1
    const box = document.querySelector('.sprite-box') as HTMLElement | null
    if (pokemon.level === 0) {
      spriteEl.classList.add('is-pokeball')
      spriteEl.style.width = `${44 * scale}px`
      spriteEl.style.height = `${44 * scale}px`
    } else {
      spriteEl.classList.remove('is-pokeball')
      spriteEl.style.width = `${64 * scale}px`
      spriteEl.style.height = `${64 * scale}px`
    }
    if (box) {
      box.style.width = `${70 * scale}px`
      box.style.height = `${70 * scale}px`
    }
  }

  if (nameEl) {
    const isShiny = pokemon.color === PokemonColor.shiny
    nameEl.innerHTML = `${pokemon.level === 0 ? 'Pokéball' : pokemon.name} ${
      isShiny ? '<span class="shiny-star">★</span>' : ''
    }`
  }

  if (levelEl) {
    levelEl.textContent = pokemon.level === 0 ? 'Huevo' : `Lv. ${pokemon.level}`
  }

  // Type Badges in Popup
  if (typesEl) {
    if (pokemon.level === 0 || !pokemon.types || pokemon.types.length === 0) {
      typesEl.innerHTML = '<span class="type-badge" style="background:#334155; color:#94a3b8; border-color:transparent;">HUEVO</span>'
    } else {
      typesEl.innerHTML = pokemon.types
        .map((t) => {
          const badge = TYPE_BADGES[t]
          return badge ? `<span class="type-badge type-${t}">${badge.abbr}</span>` : ''
        })
        .join('')
    }
  }

  const reqXP = getRequiredXPForLevel(pokemon.level)
  const percent = Math.min(100, Math.floor((pokemon.xp / reqXP) * 100))
  if (xpBarEl) {
    xpBarEl.style.width = `${percent}%`
  }
  if (xpTextEl) {
    xpTextEl.textContent = `${pokemon.xp} / ${reqXP} XP`
  }

  // 2. Stats
  const pokedexCountEl = document.getElementById('stat-pokedex')
  const candiesCountEl = document.getElementById('stat-candies')
  const badgesCountEl = document.getElementById('stat-badges')

  if (pokedexCountEl) pokedexCountEl.textContent = `${state.pokedex.length}`
  const candies = state.items['rare-candy'] || 0
  if (candiesCountEl) candiesCountEl.textContent = `${candies}`
  if (badgesCountEl) badgesCountEl.textContent = `${state.badges.length}`

  // 3. Settings controls
  const visibleToggle = document.getElementById('toggle-visible') as HTMLInputElement
  const soundToggle = document.getElementById('toggle-sound') as HTMLInputElement
  const newtabToggle = document.getElementById('toggle-newtab') as HTMLInputElement
  const scaleRange = document.getElementById('range-scale') as HTMLInputElement
  const scaleVal = document.getElementById('scale-val')

  if (visibleToggle) visibleToggle.checked = state.settings.petVisible
  if (soundToggle) soundToggle.checked = state.settings.soundEnabled
  if (newtabToggle) newtabToggle.checked = state.settings.customNewTab !== false
  if (scaleRange && scaleVal) {
    scaleRange.value = `${state.settings.scaleFactor || 1.0}`
    scaleVal.textContent = `${(state.settings.scaleFactor || 1.0).toFixed(1)}x`
  }

  // 4. Button states
  const useCandyBtn = document.getElementById('btn-use-candy') as HTMLButtonElement
  if (useCandyBtn) {
    useCandyBtn.disabled = candies <= 0 || pokemon.level === 0
  }
}

async function init(): Promise<void> {
  // Load state
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_STATE' })
    if (res && res.success && res.state) {
      updateUI(res.state)
    }
  } catch (err) {
    console.error('Failed to get state in popup:', err)
  }

  // Listen for background updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.action === 'POKECHI_STATE_UPDATED' && message.state) {
      updateUI(message.state)
    }
  })

  // Open Pokedex
  document.getElementById('btn-open-pokedex')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_POKEDEX' })
  })

  // Toggle pet visible
  document.getElementById('toggle-visible')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { petVisible: checked },
    })
  })

  // Toggle custom new tab
  document.getElementById('toggle-newtab')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { customNewTab: checked },
    })
  })

  // Toggle sound
  document.getElementById('toggle-sound')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { soundEnabled: checked },
    })
  })

  // Range scale
  document.getElementById('range-scale')?.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value)
    const scaleVal = document.getElementById('scale-val')
    if (scaleVal) scaleVal.textContent = `${val.toFixed(1)}x`
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { scaleFactor: val },
    })
  })

  // Spawn new Pokemon
  document.getElementById('btn-new-pokemon')?.addEventListener('click', async () => {
    const ok = confirm('¿Quieres obtener un nuevo Pokémon? El progreso del actual se guardará en tu Poké-Róster.')
    if (!ok) return
    try {
      const res = await chrome.runtime.sendMessage({ type: 'SPAWN_NEW_POKEMON' })
      if (res && res.success && res.state) {
        updateUI(res.state)
      } else {
        console.error('Failed to spawn new pokemon:', res && res.error)
      }
    } catch (err) {
      console.error('Failed to spawn new pokemon:', err)
    }
  })

  // Use Rare Candy
  document.getElementById('btn-use-candy')?.addEventListener('click', async () => {
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'USE_ITEM',
        itemId: 'rare-candy',
      })
      if (res && res.state) {
        updateUI(res.state)
      }
    } catch (err) {
      console.error('Failed to use rare candy:', err)
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  void init()
})
