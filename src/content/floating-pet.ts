import { UserPokemon, PokechiState } from '../types'
import { POKEMON_DATA } from '../common/pokemon-data'
import { PokemonColor, PokemonGeneration } from '../common/types'
import { TYPE_BADGES } from '../common/type-badges'
import { getRequiredXPForLevel } from '../background/game-logic'

const POKEBALL_SIZE = 36
const POKEMON_BASE_SIZE = 54
const TICK_INTERVAL_MS = 100

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

    // Check if XP was earned and show floating badge
    if (extra && extra.xpEarned) {
      this.showXPNotification(Number(extra.xpEarned), String(extra.reason || ''))
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
          transition: transform 0.1s ease-out;
        }

        #pet-wrapper:active {
          cursor: grabbing;
        }

        /* Mini XP & Info Bar */
        #xp-bar-container {
          background: rgba(18, 20, 29, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
          border-radius: 8px;
          padding: 5px 8px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 120px;
          opacity: 0.92;
          transition: opacity 0.2s, transform 0.2s;
        }

        #pet-wrapper:hover #xp-bar-container {
          opacity: 1;
          transform: scale(1.05);
        }

        .name-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .types-container {
          display: inline-flex;
          gap: 3px;
          margin-left: 4px;
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
          margin-left: 2px;
          font-size: 10px;
        }

        .xp-track {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          overflow: hidden;
        }

        .xp-fill {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          border-radius: 4px;
          width: 0%;
          transition: width 0.3s ease;
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
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
          pointer-events: none;
          animation: floatUp 1.4s ease-out forwards;
          white-space: nowrap;
          z-index: 10;
        }

        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(4px) scale(0.85);
          }
          20% {
            opacity: 1;
            transform: translateY(-4px) scale(1.05);
          }
          80% {
            opacity: 1;
            transform: translateY(-16px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-26px) scale(0.9);
          }
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
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0);
          }
        }
      </style>

      <div id="pet-wrapper">
        <div id="xp-bar-container">
          <div class="name-row">
            <div style="display:flex; align-items:center; gap:2px;">
              <span id="pet-name">Pikachu</span>
              <span id="pet-types" class="types-container"></span>
            </div>
            <span id="pet-level">Lv. 1</span>
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
    if (!wrapper || !sprite) return

    // Hover state
    wrapper.addEventListener('mouseenter', () => {
      this.isHovered = true
      this.updateDisplay()
    })

    wrapper.addEventListener('mouseleave', () => {
      this.isHovered = false
      this.updateDisplay()
    })

    // Click -> play cry
    sprite.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this.isDragging) return
      this.playCry()
      this.triggerSparkle()
    })

    // Drag and Drop
    wrapper.addEventListener('mousedown', (e) => {
      this.isDragging = false
      this.dragStartX = e.clientX - this.posX
      this.dragStartY = e.clientY - (window.innerHeight - this.posY)

      const onMouseMove = (moveEvent: MouseEvent) => {
        this.isDragging = true
        this.posX = Math.max(10, Math.min(window.innerWidth - 80, moveEvent.clientX - this.dragStartX))
        const rawY = window.innerHeight - (moveEvent.clientY - this.dragStartY)
        this.posY = Math.max(10, Math.min(window.innerHeight - 100, rawY))
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
    const sprite = this.shadow.getElementById('pokemon-sprite') as HTMLImageElement | null
    if (!wrapper || !sprite) return

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

    // Flip sprite horizontally based on direction
    const scale = this.state.pokemon.scale || 1
    const flip = this.direction === 'right' ? 1 : -1
    sprite.style.transform = `scaleX(${flip}) scale(${scale})`
  }

  public updateDisplay(): void {
    if (!this.shadow || !this.state?.pokemon) return

    const pokemon = this.state.pokemon
    const wrapper = this.shadow.getElementById('pet-wrapper')
    const sprite = this.shadow.getElementById('pokemon-sprite') as HTMLImageElement | null
    const nameEl = this.shadow.getElementById('pet-name')
    const levelEl = this.shadow.getElementById('pet-level')
    const typesEl = this.shadow.getElementById('pet-types')
    const xpFillEl = this.shadow.getElementById('xp-fill')
    const xpTextEl = this.shadow.getElementById('xp-text')

    if (!wrapper || !sprite || !nameEl || !levelEl || !xpFillEl || !xpTextEl) return

    // 1. Text & XP Bar
    if (pokemon.level === 0) {
      nameEl.textContent = 'Pokéball'
      levelEl.textContent = 'Egg'
      if (typesEl) typesEl.innerHTML = ''
    } else {
      const isShiny = pokemon.color === PokemonColor.shiny
      nameEl.innerHTML = `${pokemon.name} ${isShiny ? '<span class="shiny-icon">★</span>' : ''}`
      levelEl.textContent = `Lv. ${pokemon.level}`

      // Type badges in floating bar
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

    const reqXP = getRequiredXPForLevel(pokemon.level)
    const currentXP = pokemon.xp
    const percent = Math.min(100, Math.floor((currentXP / reqXP) * 100))
    xpFillEl.style.width = `${percent}%`
    xpTextEl.textContent = `${currentXP} / ${reqXP} XP`

    // 2. Sprite image
    const isIdle = this.isHovered || pokemon.level === 0
    const spriteUrl = this.getSpriteUrl(pokemon, isIdle)

    const renderKey = `${spriteUrl}|${isIdle}|${pokemon.scale}`
    if (renderKey !== this.lastRenderedKey) {
      this.lastRenderedKey = renderKey
      sprite.src = spriteUrl

      if (pokemon.level === 0) {
        sprite.style.width = `${POKEBALL_SIZE * pokemon.scale}px`
        sprite.style.height = `${POKEBALL_SIZE * pokemon.scale}px`
        sprite.style.objectFit = 'contain'
      } else {
        sprite.style.width = `${POKEMON_BASE_SIZE * pokemon.scale}px`
        sprite.style.height = `${POKEMON_BASE_SIZE * pokemon.scale}px`
        sprite.style.objectFit = 'contain'
      }
    }
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
  }

  private showXPNotification(amount: number, reason: string): void {
    if (!this.shadow) return
    const wrapper = this.shadow.getElementById('pet-wrapper')
    if (!wrapper) return

    const badge = document.createElement('div')
    badge.className = 'xp-badge'

    let label = `+${amount} XP`
    if (reason === 'youtube_song') label = `+${amount} XP 🎵 Canción!`
    else if (reason === 'gmail_read') label = `+${amount} XP ✉️ Correo leído!`
    else if (reason === 'gmail_deleted') label = `+${amount} XP 🗑️ Correo eliminado!`
    else if (reason === 'tab_event') label = `+${amount} XP 📑 Pestaña!`
    else if (reason === 'active_minute') label = `+${amount} XP ⏱️ Actividad!`
    else if (reason === 'page_clicks') label = `+${amount} XP 🖱️ Clics!`
    else if (reason === 'typing') label = `+${amount} XP ⌨️ Escritura!`
    else if (reason) label = `+${amount} XP ${reason}`

    badge.textContent = label
    wrapper.appendChild(badge)

    setTimeout(() => {
      badge.remove()
    }, 1400)
  }

  public remove(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    if (this.host) {
      this.host.remove()
      this.host = null
      this.shadow = null
    }
  }
}
