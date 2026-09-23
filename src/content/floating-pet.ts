import { UserPokemon, PokechiState } from '../types'
import { POKEMON_DATA } from '../common/pokemon-data'
import { PokemonColor, PokemonGeneration } from '../common/types'
import { TYPE_BADGES } from '../common/type-badges'
import { getRequiredXPForLevel } from '../background/game-logic'

const POKEBALL_SIZE = 36
const POKEMON_BASE_SIZE = 54
const TICK_INTERVAL_MS = 100
// How long (ms) the XP bar stays visible after gaining XP
const XP_BAR_VISIBLE_DURATION = 3000

export class FloatingPet {
  private host: HTMLElement | null = null
  private shadow: ShadowRoot | null = null
  private state: PokechiState | null = null
  private intervalId?: number
  private isHovered = false
  private posX = 80
  private posY = 20
  private direction: 'left' | 'right' = 'right'
  private speed = 2.5
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private lastRenderedKey = ''
  private xpBarHideTimer?: number

  constructor() {}

  public init(initialState: PokechiState): void {
    this.state = initialState

    if (!initialState.settings?.petVisible) {
      this.remove()
      return
    }

    if (!this.host) {
      this.mount()
    }

    this.updateDisplay()
    this.startLoop()
  }

  public updateState(newState: PokechiState, extra?: Record<string, unknown>): void {
    this.state = newState

    if (!newState.settings?.petVisible) {
      this.remove()
      return
    }

    if (!this.host) {
      this.mount()
    }

    // Check if XP was earned and show floating badge + xp bar
    if (extra && extra.xpEarned) {
      this.showXPNotification(Number(extra.xpEarned), String(extra.reason || ''))
      this.showXPBarTemporarily()
    }

    // Check if evolved
    if (extra && extra.evolved) {
      this.triggerEvolveEffect()
    }

    this.updateDisplay()
  }

  private mount(): void {
    let existing = document.getElementById('pokechi-host')
    if (existing) {
      existing.remove()
    }

    this.host = document.createElement('div')
    this.host.id = 'pokechi-host'
    this.host.style.position = 'fixed'
    this.host.style.zIndex = '2147483647'
    this.host.style.pointerEvents = 'none'
    this.host.style.left = '0'
    this.host.style.top = '0'
    this.host.style.width = '100vw'
    this.host.style.height = '100vh'
    this.host.style.overflow = 'hidden'

    this.shadow = this.host.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        #pet-wrapper {
          position: absolute;
          bottom: 20px;
          left: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
          pointer-events: auto;
          cursor: grab;
        }

        #pet-wrapper:active {
          cursor: grabbing;
        }

        /* Mini XP & Info Bar — hidden by default, shown on hover or XP gain */
        #xp-bar-container {
          background: rgba(18, 20, 29, 0.92);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
          border-radius: 10px;
          padding: 6px 9px;
          margin-bottom: 7px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 136px;
          max-width: 180px;

          /* Hidden by default — becomes visible on hover or xp-visible class */
          opacity: 0;
          transform: translateY(6px) scale(0.96);
          pointer-events: none;
          transition: opacity 0.22s ease, transform 0.22s ease;
        }

        /* Visible when hovered OR when the xp-visible class is on the wrapper */
        #pet-wrapper:hover #xp-bar-container,
        #pet-wrapper.xp-visible #xp-bar-container {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .name-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          color: #f1f5f9;
          gap: 4px;
        }

        .name-left {
          display: flex;
          align-items: center;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }

        .pokemon-name-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .types-container {
          display: inline-flex;
          gap: 3px;
          flex-shrink: 0;
        }

        .mini-type-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          line-height: 1.1;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        /* Mini Type Badge Colors */
        .type-normal   { background: #A8A878; color: #18181b; }
        .type-fire     { background: #F08030; color: #18181b; }
        .type-water    { background: #6890F0; color: #18181b; }
        .type-electric { background: #F8D030; color: #18181b; }
        .type-grass    { background: #78C850; color: #18181b; }
        .type-ice      { background: #98D8D8; color: #18181b; }
        .type-fighting { background: #C03028; color: #ffffff; }
        .type-poison   { background: #A040A0; color: #ffffff; }
        .type-ground   { background: #E0C068; color: #18181b; }
        .type-flying   { background: #A890F0; color: #18181b; }
        .type-psychic  { background: #F85888; color: #18181b; }
        .type-bug      { background: #A8B820; color: #18181b; }
        .type-rock     { background: #B8A038; color: #18181b; }
        .type-ghost    { background: #705898; color: #ffffff; }
        .type-dragon   { background: #7038F8; color: #ffffff; }
        .type-dark     { background: #705848; color: #ffffff; }
        .type-steel    { background: #B8B8D0; color: #18181b; }

        .shiny-icon {
          color: #facc15;
          font-size: 10px;
          flex-shrink: 0;
        }

        /* Pokechidex shortcut button */
        #btn-open-pokedex {
          flex-shrink: 0;
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38bdf8;
          border-radius: 4px;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 5px;
          cursor: pointer;
          letter-spacing: 0.3px;
          line-height: 1.3;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }

        #btn-open-pokedex:hover {
          background: rgba(56, 189, 248, 0.28);
          color: #7dd3fc;
        }

        .xp-track {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.14);
          border-radius: 4px;
          overflow: hidden;
        }

        .xp-fill {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          border-radius: 4px;
          width: 0%;
          transition: width 0.35s ease;
        }

        .xp-text {
          font-size: 9px;
          color: #94a3b8;
          text-align: right;
        }

        /* Sprite & Animations */
        #sprite-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #pokemon-sprite {
          image-rendering: pixelated;
          display: block;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));
          transition: transform 0.1s ease;
        }

        /* XP Gain Notification Tag */
        .xp-badge {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          pointer-events: none;
          animation: floatUp 1.4s ease-out forwards;
          white-space: nowrap;
          z-index: 10;
        }

        @keyframes floatUp {
          0%   { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.85); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.05); }
          80%  { opacity: 1; transform: translateX(-50%) translateY(-18px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-28px) scale(0.9); }
        }

        /* Sparkle burst for shiny */
        .sparkle-burst {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .sparkle-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #facc15;
          border-radius: 50%;
          opacity: 0;
        }

        .sparkle-burst.active .sparkle-particle {
          animation: particleTwinkle 0.9s ease-out forwards;
        }

        @keyframes particleTwinkle {
          0%   { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
        }
      </style>

      <div id="pet-wrapper">
        <div id="xp-bar-container">
          <div class="name-row">
            <div class="name-left">
              <span id="pet-name" class="pokemon-name-text">Pokéball</span>
              <span id="pet-shiny" class="shiny-icon" style="display:none">★</span>
              <span id="pet-types" class="types-container"></span>
            </div>
            <button id="btn-open-pokedex" title="Ver en Pokechidex">DEX</button>
          </div>
          <div class="xp-track">
            <div id="xp-fill" class="xp-fill"></div>
          </div>
          <div id="xp-text" class="xp-text">0 / 500 XP</div>
        </div>

        <div id="sprite-container">
          <img id="pokemon-sprite" alt="pokemon" />
          <div id="sparkle-burst" class="sparkle-burst">
            <span class="sparkle-particle" style="--tx: -20px; --ty: -20px;"></span>
            <span class="sparkle-particle" style="--tx: 20px; --ty: -20px;"></span>
            <span class="sparkle-particle" style="--tx: -25px; --ty: 10px;"></span>
            <span class="sparkle-particle" style="--tx: 25px; --ty: 10px;"></span>
            <span class="sparkle-particle" style="--tx: 0px; --ty: -30px;"></span>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(this.host)
    this.attachEvents()
  }

  private attachEvents(): void {
    if (!this.shadow) return
    const wrapper = this.shadow.getElementById('pet-wrapper')
    const sprite = this.shadow.getElementById('pokemon-sprite')
    const pokedexBtn = this.shadow.getElementById('btn-open-pokedex')
    if (!wrapper || !sprite) return

    // Hover state — toggle idle sprite
    wrapper.addEventListener('mouseenter', () => {
      this.isHovered = true
      this.lastRenderedKey = '' // force sprite refresh
      this.updateDisplay()
    })

    wrapper.addEventListener('mouseleave', () => {
      this.isHovered = false
      this.lastRenderedKey = '' // force sprite refresh
      this.updateDisplay()
    })

    // Click -> play cry
    sprite.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this.isDragging) return
      this.playCry()
      this.triggerSparkle()
    })

    // Open Pokechidex
    pokedexBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      chrome.runtime.sendMessage({ type: 'OPEN_POKEDEX' })
    })

    // Drag and Drop
    wrapper.addEventListener('mousedown', (e) => {
      // Don't initiate drag if clicking the pokedex button
      if ((e.target as HTMLElement).id === 'btn-open-pokedex') return

      this.isDragging = false
      this.dragStartX = e.clientX - this.posX
      this.dragStartY = e.clientY - (window.innerHeight - this.posY)

      const onMouseMove = (moveEvent: MouseEvent) => {
        this.isDragging = true
        this.posX = Math.max(10, Math.min(window.innerWidth - 80, moveEvent.clientX - this.dragStartX))
        const rawY = window.innerHeight - (moveEvent.clientY - this.dragStartY)
        this.posY = Math.max(10, Math.min(window.innerHeight - 120, rawY))
        wrapper.style.left = `${this.posX}px`
        wrapper.style.bottom = `${this.posY}px`
      }

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        setTimeout(() => {
          this.isDragging = false
        }, 50)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    })
  }

  private startLoop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
    }

    this.intervalId = window.setInterval(() => {
      this.tick()
    }, TICK_INTERVAL_MS)
  }

  private tick(): void {
    if (!this.shadow || !this.state?.pokemon || this.isHovered || this.isDragging) {
      return
    }

    const wrapper = this.shadow.getElementById('pet-wrapper')
    if (!wrapper) return

    // Pokeball (level 0) stays in place
    if (this.state.pokemon.level === 0) {
      return
    }

    // Walking movement
    const step = this.direction === 'right' ? this.speed : -this.speed
    this.posX += step

    // Collision with window boundaries
    const rightLimit = window.innerWidth - 90
    if (this.posX >= rightLimit) {
      this.posX = rightLimit
      this.direction = 'left'
    } else if (this.posX <= 15) {
      this.posX = 15
      this.direction = 'right'
    }

    wrapper.style.left = `${this.posX}px`
    wrapper.style.bottom = `${this.posY}px`
  }

  public updateDisplay(): void {
    if (!this.shadow || !this.state?.pokemon) return

    const pokemon = this.state.pokemon
    const wrapper = this.shadow.getElementById('pet-wrapper')
    const sprite = this.shadow.getElementById('pokemon-sprite') as HTMLImageElement | null
    const nameEl = this.shadow.getElementById('pet-name')
    const shinyEl = this.shadow.getElementById('pet-shiny') as HTMLElement | null
    const typesEl = this.shadow.getElementById('pet-types')
    const xpFillEl = this.shadow.getElementById('xp-fill')
    const xpTextEl = this.shadow.getElementById('xp-text')

    if (!wrapper || !sprite || !nameEl || !xpFillEl || !xpTextEl) return

    // 1. Name, shiny star, and types
    if (pokemon.level === 0) {
      nameEl.textContent = 'Pokéball'
      if (shinyEl) shinyEl.style.display = 'none'
      if (typesEl) typesEl.innerHTML = ''
    } else {
      const isShiny = pokemon.color === PokemonColor.shiny
      nameEl.textContent = pokemon.name

      if (shinyEl) {
        shinyEl.style.display = isShiny ? 'inline' : 'none'
      }

      if (typesEl) {
        if (!pokemon.types || pokemon.types.length === 0) {
          typesEl.innerHTML = ''
        } else {
          typesEl.innerHTML = pokemon.types
            .map((t) => {
              const badge = TYPE_BADGES[t]
              return badge ? `<span class="mini-type-badge type-${t}">${badge.abbr}</span>` : ''
            })
            .join('')
        }
      }
    }

    // 2. XP Bar
    const reqXP = getRequiredXPForLevel(pokemon.level)
    const currentXP = pokemon.xp
    const percent = Math.min(100, Math.floor((currentXP / reqXP) * 100))
    xpFillEl.style.width = `${percent}%`
    xpTextEl.textContent = `${currentXP} / ${reqXP} XP`

    // 3. Sprite image
    const isIdle = this.isHovered || pokemon.level === 0
    const spriteUrl = this.getSpriteUrl(pokemon, isIdle)
    const scale = this.state.settings?.scaleFactor || 1

    const renderKey = `${spriteUrl}|${isIdle}|${scale}`
    if (renderKey !== this.lastRenderedKey) {
      this.lastRenderedKey = renderKey
      sprite.src = spriteUrl

      if (pokemon.level === 0) {
        sprite.style.width = `${POKEBALL_SIZE * scale}px`
        sprite.style.height = `${POKEBALL_SIZE * scale}px`
        sprite.style.objectFit = 'contain'
      } else {
        sprite.style.width = `${POKEMON_BASE_SIZE * scale}px`
        sprite.style.height = `${POKEMON_BASE_SIZE * scale}px`
        sprite.style.objectFit = 'contain'
      }
    }

    // 4. Flip direction in tick (not in updateDisplay)
    const flip = this.direction === 'right' ? 1 : -1
    sprite.style.transform = `scaleX(${flip}) scale(1)`
  }

  private getSpriteUrl(pokemon: UserPokemon, isIdle: boolean): string {
    if (pokemon.level === 0) {
      return chrome.runtime.getURL('media/pokeball.gif')
    }

    const data = POKEMON_DATA[pokemon.type]
    let gen = 'gen1'
    if (data?.generation === PokemonGeneration.Gen2) gen = 'gen2'
    else if (data?.generation === PokemonGeneration.Gen3) gen = 'gen3'
    else if (data?.generation === PokemonGeneration.Gen4) gen = 'gen4'

    const color = pokemon.color === PokemonColor.shiny ? 'shiny' : 'default'
    const anim = isIdle ? `${color}_idle_8fps.gif` : `${color}_walk_8fps.gif`

    return chrome.runtime.getURL(`media/${gen}/${pokemon.type}/${anim}`)
  }

  private playCry(): void {
    if (!this.state?.pokemon || this.state.pokemon.level === 0) return
    if (this.state.settings && !this.state.settings.soundEnabled) return

    const data = POKEMON_DATA[this.state.pokemon.type]
    let gen = 'gen1'
    if (data?.generation === PokemonGeneration.Gen2) gen = 'gen2'
    else if (data?.generation === PokemonGeneration.Gen3) gen = 'gen3'
    else if (data?.generation === PokemonGeneration.Gen4) gen = 'gen4'

    const audioUrl = chrome.runtime.getURL(`media/${gen}/${this.state.pokemon.type}/cry.mp3`)
    const audio = new Audio(audioUrl)
    audio.volume = 0.6
    audio.play().catch(() => {})
  }

  private triggerSparkle(): void {
    if (!this.shadow) return
    const burst = this.shadow.getElementById('sparkle-burst')
    if (burst) {
      burst.classList.remove('active')
      void burst.offsetWidth
      burst.classList.add('active')
      setTimeout(() => {
        burst.classList.remove('active')
      }, 1000)
    }
  }

  private triggerEvolveEffect(): void {
    this.triggerSparkle()
    this.playCry()
    this.showXPNotification(0, '¡Evolución!')
    this.showXPBarTemporarily()
  }

  private showXPBarTemporarily(): void {
    if (!this.shadow) return
    const wrapper = this.shadow.getElementById('pet-wrapper')
    if (!wrapper) return

    wrapper.classList.add('xp-visible')

    if (this.xpBarHideTimer) {
      window.clearTimeout(this.xpBarHideTimer)
    }
    this.xpBarHideTimer = window.setTimeout(() => {
      wrapper.classList.remove('xp-visible')
    }, XP_BAR_VISIBLE_DURATION)
  }

  private showXPNotification(amount: number, reason: string): void {
    if (!this.shadow) return
    const container = this.shadow.getElementById('sprite-container')
    if (!container) return

    const badge = document.createElement('div')
    badge.className = 'xp-badge'

    let label = `+${amount} XP`
    if (reason === 'youtube_song') label = `+${amount} XP 🎵 Canción!`
    else if (reason === 'gmail_read') label = `+${amount} XP ✉️ Correo leído!`
    else if (reason === 'gmail_deleted') label = `+${amount} XP 🗑️ Eliminado!`
    else if (reason === 'tab_event') label = `+${amount} XP 📑 Pestaña!`
    else if (reason === 'active_minute') label = `+${amount} XP ⏱️ Actividad!`
    else if (reason === 'page_clicks') label = `+${amount} XP 🖱️ Clics!`
    else if (reason === 'typing') label = `+${amount} XP ⌨️ Escritura!`
    else if (reason === '¡Evolución!') label = `✨ ¡Evolución!`
    else if (reason) label = `+${amount} XP ${reason}`

    badge.textContent = label
    container.appendChild(badge)

    setTimeout(() => {
      badge.remove()
    }, 1500)
  }

  public remove(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    if (this.xpBarHideTimer) {
      window.clearTimeout(this.xpBarHideTimer)
    }
    if (this.host) {
      this.host.remove()
      this.host = null
      this.shadow = null
    }
  }
}
