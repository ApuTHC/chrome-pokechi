import { PokechiState, UserPokemon } from '../state'
import { POKEMON_DATA } from '../common/pokemon-data'
import { PokemonColor, PokemonGeneration, PokemonRarity } from '../common/types'
import { TYPE_BADGES, getLocalizedTypeBadges } from '../common/type-badges'
import { getRequiredXPForLevel } from '../common/xp'
import { sendPokechiMessage } from '../common/messages'
import { subscribeToState } from '../common/state-sync'
import { getStrings, isSupportedLanguage, Strings } from '../common/i18n'
import { getEvolutionLineContaining, isEvolutionLineMaxed, resolveEvolutionLine } from '../common/pokemon-evolutions'

let state: PokechiState | null = null

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

// L5: the popup rebuilds nothing on a state tick, so the static labels are
// written only when the language actually changed (a settings write the
// user just made, or the first render).
let lastLabelsLang = ''

function applyLabels(strings: Strings): void {
  const setText = (id: string, value: string): void => {
    const el = document.getElementById(id)
    if (el) el.textContent = value
  }
  setText('label-xp-progress', strings.popupXpProgress)
  setText('label-caught', strings.popupCaught)
  setText('label-candies', strings.popupCandies)
  setText('label-badges', strings.counterBadges)
  setText('label-pet-visible', strings.popupPetVisible)
  setText('label-newtab', strings.popupCustomNewTab)
  setText('label-sound', strings.popupSoundEnabled)
  setText('label-scale', strings.popupScale)
  setText('label-language', strings.languageLabel)
  // The icon lives in the HTML (the official rare-candy sprite, styled like
  // the other action buttons) — the dictionaries only carry the translated text.
  setText('label-use-candy', strings.useItemButton(strings.itemNames['rare-candy'] ?? 'Rare Candy'))
  setText('label-new-pokemon', strings.catchNewPokemonButton)
}

function updateUI(state: PokechiState): void {
  const pokemon = state.pokemon
  if (!pokemon) return

  // L5: language drives every visible label on this page.
  const lang = state.settings?.language || 'en'
  const strings = getStrings(lang)
  if (lang !== lastLabelsLang) {
    lastLabelsLang = lang
    document.documentElement.lang = lang
    applyLabels(strings)
    const select = document.getElementById('select-language') as HTMLSelectElement | null
    if (select && isSupportedLanguage(lang) && select.value !== lang) select.value = lang
  }

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
    levelEl.textContent = pokemon.level === 0 ? strings.popupLevelEgg : `Lv. ${pokemon.level}`
  }

  // Type Badges in Popup
  if (typesEl) {
    if (pokemon.level === 0 || !pokemon.types || pokemon.types.length === 0) {
      typesEl.innerHTML = `<span class="type-badge is-egg">${strings.popupLevelEgg}</span>`
    } else {
      const badges = getLocalizedTypeBadges(strings.typeAbbreviations)
      typesEl.innerHTML = pokemon.types
        .map((t) => {
          const badge = badges[t] ?? TYPE_BADGES[t]
          return badge ? `<span class="type-badge type-${t}">${badge.abbr}</span>` : ''
        })
        .join('')
    }
  }

  // Rarity border for the pet card
  const petCardEl = document.querySelector('.pet-card') as HTMLElement | null
  if (petCardEl) {
    const data = POKEMON_DATA[pokemon.type]
    const rarity = data?.rarity as PokemonRarity | undefined
    petCardEl.classList.remove('rarity-sub-legendary', 'rarity-legendary', 'rarity-mythical', 'rarity-fossil')
    if (rarity) {
      petCardEl.classList.add(`rarity-${rarity}`)
    }
  }

  // Check if this evolution line is maxed out (fully evolved or already completed)
  const evolutionLine = pokemon.evolutionLine
    ? resolveEvolutionLine(pokemon.evolutionLine as PokemonType[])
    : getEvolutionLineContaining(pokemon.type)
  const isMaxed = evolutionLine
    ? isEvolutionLineMaxed(evolutionLine, pokemon.level)
    : false

  const reqXP = getRequiredXPForLevel(pokemon.level)
  if (xpBarEl) {
    if (isMaxed) {
      xpBarEl.style.width = '100%'
      xpBarEl.style.background = 'linear-gradient(90deg, var(--gold), var(--gold-dim))'
    } else {
      const percent = Math.min(100, Math.floor((pokemon.xp / reqXP) * 100))
      xpBarEl.style.width = `${percent}%`
      xpBarEl.style.background = 'var(--grad-xp-popup)'
    }
  }
  if (xpTextEl) {
    xpTextEl.textContent = isMaxed ? strings.xpMax : `${pokemon.xp} / ${reqXP} XP`
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
  const res = await sendPokechiMessage({ type: 'GET_STATE' })
  if (res.success) {
    state = res.state
    updateUI(res.state)
  } else {
    console.error('Failed to get state in popup:', res.error)
  }

  // R5: state re-renders come from the storage write itself.
  subscribeToState((newState) => {
    state = newState
    updateUI(newState)
  })

  // Open Pokedex
  document.getElementById('btn-open-pokedex')?.addEventListener('click', () => {
    void sendPokechiMessage({ type: 'OPEN_POKEDEX' })
  })

  // Toggle pet visible
  document.getElementById('toggle-visible')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked
    void sendPokechiMessage({
      type: 'UPDATE_SETTINGS',
      settings: { petVisible: checked },
    })
  })

  // Toggle custom new tab
  document.getElementById('toggle-newtab')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked
    void sendPokechiMessage({
      type: 'UPDATE_SETTINGS',
      settings: { customNewTab: checked },
    })
  })

  // Toggle sound
  document.getElementById('toggle-sound')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked
    void sendPokechiMessage({
      type: 'UPDATE_SETTINGS',
      settings: { soundEnabled: checked },
    })
  })

  // L5: language picker — persists through the same settings write as every
  // other toggle, then all surfaces repaint from the storage change.
  const languageSelect = document.getElementById('select-language') as HTMLSelectElement | null
  languageSelect?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value
    if (!isSupportedLanguage(value)) return
    void sendPokechiMessage({
      type: 'UPDATE_SETTINGS',
      settings: { language: value },
    })
  })

  // Range scale — label updates live, but the settings write is debounced
  // (R9) so dragging doesn't spam UPDATE_SETTINGS/storage writes.
  let scaleSaveTimer: ReturnType<typeof setTimeout> | undefined
  document.getElementById('range-scale')?.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value)
    const scaleVal = document.getElementById('scale-val')
    if (scaleVal) scaleVal.textContent = `${val.toFixed(1)}x`
    if (scaleSaveTimer) clearTimeout(scaleSaveTimer)
    scaleSaveTimer = setTimeout(() => {
      void sendPokechiMessage({
        type: 'UPDATE_SETTINGS',
        settings: { scaleFactor: val },
      })
    }, 200)
  })

  // Spawn new Pokemon
  document.getElementById('btn-new-pokemon')?.addEventListener('click', async () => {
    const strings = getStrings(state?.settings.language || 'en')
    const ok = confirm(strings.catchNewPokemonConfirm)
    if (!ok) return
    const res = await sendPokechiMessage({ type: 'SPAWN_NEW_POKEMON' })
    if (res.success) {
      updateUI(res.state)
    } else {
      console.error('Failed to spawn new pokemon:', res.error)
    }
  })

  // Use Rare Candy
  document.getElementById('btn-use-candy')?.addEventListener('click', async () => {
    const res = await sendPokechiMessage({
      type: 'USE_ITEM',
      itemId: 'rare-candy',
    })
    if (res.success) {
      updateUI(res.state)
    } else {
      console.error('Failed to use rare candy:', res.error)
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  void init()
})
