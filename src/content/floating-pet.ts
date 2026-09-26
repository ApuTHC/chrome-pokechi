import { UserPokemon, PokechiState } from '../state'
import { XPEvent, ItemRevealEventMessage } from '../common/state-sync'
import { sendPokechiMessage } from '../common/messages'
import { POKEMON_DATA } from '../common/pokemon-data'
import { PokemonColor, PokemonGeneration, PokemonElementType, PokemonType } from '../common/types'
import { TYPE_BADGES, getLocalizedTypeBadges, getTypeBadgeCssRules } from '../common/type-badges'
import { LOCATE_ICON } from '../common/icons'
import { getRequiredXPForLevel, trimXPDecimals } from '../common/xp'
import { getEvolutionLineContaining, isEvolutionLineMaxed, resolveEvolutionLine } from '../common/pokemon-evolutions'
import { getChallengeDisplay } from '../common/challenges'
import { getRarityBorderCssRules, getRarityCssVariables } from '../common/rarity-colors'
import { getStrings } from '../common/i18n'
import { DESIGN_TOKENS as T } from '../common/design-tokens'

const POKEBALL_SIZE = 36
const POKEMON_BASE_SIZE = 54
const TICK_INTERVAL_MS = 100
// How long (ms) the XP bar stays visible after gaining XP
const XP_BAR_VISIBLE_DURATION = 3000
// How long a pokemon stands still showing its idle animation after evolving.
// Without it the first tick would send it walking before idle is ever seen.
const IDLE_AFTER_CHANGE_MS = 1500

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
  private idleUntil = 0
  private idleWindowNotified = false
  // Cached element lookups — mount() fills them once instead of
  // updateDisplay() re-running ~10 getElementById calls per state update.
  private els: {
    wrapper: HTMLElement
    sprite: HTMLImageElement
    name: HTMLElement
    shiny: HTMLElement | null
    types: HTMLElement | null
    xpFill: HTMLElement
    xpText: HTMLElement
    pokedexBtn: HTMLElement | null
    xpBarContainer: HTMLElement | null
  } | null = null
  // Last values actually written to the DOM, so identical updates are
  // skipped instead of forcing pointless style/layout invalidations.
  private lastXpKey = ''
  private lastFlip: 1 | -1 = 1

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

  public updateState(newState: PokechiState): void {
    this.state = newState

    if (!newState.settings?.petVisible) {
      this.remove()
      return
    }

    if (!this.host) {
      this.mount()
    }
    this.ensureLoop()

    this.updateDisplay()
  }

  // R5: transient coalesced XP event (separate from state sync) — drives
  // the floating +N badge, the temporary XP bar and the evolution effect.
  public onXPEvent(event: XPEvent): void {
    if (event.xpEarned) {
      this.showXPNotification(event.xpEarned, event.reason)
      this.showXPBarTemporarily()
    }

    // L11: one toast per milestone completed in this window ("🏅 name"),
    // independent of whether the same event also carried XP.
    if (event.earnedBadges && event.earnedBadges.length > 0) {
      for (const badge of event.earnedBadges) {
        this.showBadgeNotification(badge.name)
      }
    }

    // Retos: one toast per completed challenge ("🏆 name"), same lifecycle
    // as badge toasts so both can show together.
    if (event.earnedChallenges && event.earnedChallenges.length > 0) {
      for (const challenge of event.earnedChallenges) {
        this.showChallengeNotification(challenge.id)
      }
    }

    if (event.evolved) {
      // Hold the idle animation briefly so the new sprite is seen.
      this.idleUntil = Date.now() + IDLE_AFTER_CHANGE_MS
      this.idleWindowNotified = false
      this.triggerEvolveEffect()
      // The evolved state itself arrives via storage.onChanged.
      this.lastRenderedKey = ''
      this.updateDisplay()
    }
  }

  // R8: transient item reveal event (Master Ball / Premier Ball) — shows a
  // toast with the item name and revealed pokemon (shiny or normal).
  public onItemRevealEvent(event: ItemRevealEventMessage): void {
    const strings = getStrings(this.state?.settings?.language || 'en')
    const itemName = strings.itemNames[event.itemId] ?? event.itemId
    const pokemonName = POKEMON_DATA[event.pokemonType]?.name ?? event.pokemonType
    const isShiny = event.isShiny

    let message: string
    if (event.itemId === 'master-ball') {
      message = isShiny
        ? strings.masterBallRevealedMessageShiny(itemName, pokemonName)
        : strings.masterBallRevealedMessage(itemName, pokemonName)
    } else if (event.itemId === 'premier-ball') {
      message = strings.premierBallRevealedMessage(itemName, pokemonName)
    } else {
      message = `${itemName} revealed ${pokemonName}!`
    }

    // Show as a gold toast (same style as evolution badge)
    this.showXPNotification(0, 'generic', 'evolve-toast')
    // Override the text with our custom message
    const container = this.shadow?.getElementById('sprite-container')
    if (container) {
      const badge = container.querySelector('.xp-badge.evolve-toast')
      if (badge) {
        badge.textContent = message
      }
    }
  }

  private mount(): void {
    const existing = document.getElementById('pokechi-host')
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
    // S1: every palette color below comes from DESIGN_TOKENS (the TS
    // mirror of src/styles/tokens.css); only physical effects (black
    // alpha shadows) stay literal — they aren't part of the palette.
    this.shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          font-family: ${T.fontSans};
          --gold: ${T.gold};
          --gold-dim: ${T.goldDim};
          --grad-xp: ${T.gradXp};
          ${getRarityCssVariables('')}
        }

        #pet-wrapper {
          position: absolute;
          left: 0;
          bottom: 0;
          transform: translate3d(80px, -20px, 0);
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
          pointer-events: auto;
          cursor: grab;
          will-change: transform;
        }

        #pet-wrapper:active {
          cursor: grabbing;
        }

        /* Mini XP & Info Bar — hidden by default, shown on hover or XP gain */
        #xp-bar-container {
          background: ${T.panelGlass};
          backdrop-filter: blur(10px);
          border: 1px solid ${T.borderGlass};
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

        /* Visible when hovered, when the xp-visible class is on the wrapper,
           or when keyboard focus is inside — otherwise the DEX button could
           be tabbed to while its whole panel is invisible (S7). */
        #pet-wrapper:hover #xp-bar-container,
        #pet-wrapper.xp-visible #xp-bar-container,
        #pet-wrapper:focus-within #xp-bar-container {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        /* S7: explicit ring for the icon-only DEX shortcut; it always sits
           on the dark panel, where the accent clears 3:1 easily. */
        #btn-open-pokedex:focus-visible {
          outline: 2px solid ${T.accent};
          outline-offset: 1px;
        }

        .name-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          color: ${T.textStrong};
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

        /* S2: per-type colours generated from type-badges.ts — the one place
           they are written down. Selector is .mini-type-badge in this shadow
           DOM (the pages use the .type-badge default via dist/type-badges.css). */
        ${getTypeBadgeCssRules('.mini-type-badge')}

        /* Rarity colours for the XP bar container border — shared with Pokedex cards
           (CSS variables defined on :host above) */
        ${getRarityBorderCssRules('#xp-bar-container')}

        .shiny-icon {
          color: ${T.gold};
          font-size: 10px;
          flex-shrink: 0;
        }

        /* Pokechidex locate shortcut — crosshair icon like the original */
        #btn-open-pokedex {
          flex-shrink: 0;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          border: none;
          border-radius: 3px;
          background: transparent;
          color: ${T.textDim};
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        #btn-open-pokedex:hover {
          background: ${T.hoverWash};
          color: white;
        }

        /* S5 (WCAG 2.5.8): the crosshair is drawn at 16px to keep the name
           row compact, but its pointer target is expanded to 24x24 with an
           invisible overlay — same technique as the pokedex card buttons. */
        #btn-open-pokedex::after {
          content: "";
          position: absolute;
          inset: -4px;
        }

        .xp-track {
          width: 100%;
          height: 5px;
          background: ${T.trackFill};
          border-radius: 4px;
          overflow: hidden;
        }

        .xp-fill {
          height: 100%;
          background: ${T.gradXp};
          border-radius: 4px;
          width: 0%;
          transition: width 0.35s ease;
        }

        .xp-text {
          font-size: 9px;
          color: ${T.textMuted};
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
          background: linear-gradient(135deg, ${T.success}, ${T.successDark});
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          box-shadow: 0 2px 8px ${T.successGlow};
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

        /* L11: milestone toast — sits one row above the XP badge and uses a
           gold gradient, so "🏅 name" and "+N XP" can show at the same time
           without covering each other. */
        .xp-badge.badge-toast {
          top: -48px;
          background: linear-gradient(135deg, ${T.warning}, ${T.warningDark});
          box-shadow: 0 2px 8px ${T.warningGlow};
        }

        /* Evolution event: the +N badge and this one fire together, so the
           evolution toast gets its own third row instead of stacking over it. */
        .xp-badge.evolve-toast {
          top: -72px;
        }

        /* Sparkle burst for shiny / click feedback */
        .sparkle-burst {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
        }

        .sparkle-particle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: ${T.gold};
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%, -50%);
        }

        /* Particle offsets — mirrored from icons.ts SPARKLE_BURST_OFFSETS */
        .sparkle-particle:nth-child(1) { --tx: 0px; --ty: -30px; animation-delay: 0ms; }
        .sparkle-particle:nth-child(2) { --tx: 25px; --ty: -17px; animation-delay: 70ms; }
        .sparkle-particle:nth-child(3) { --tx: 27px; --ty: 15px; animation-delay: 140ms; }
        .sparkle-particle:nth-child(4) { --tx: 0px; --ty: 32px; animation-delay: 210ms; }
        .sparkle-particle:nth-child(5) { --tx: -27px; --ty: 15px; animation-delay: 280ms; }
        .sparkle-particle:nth-child(6) { --tx: -25px; --ty: -17px; animation-delay: 350ms; }

        .sparkle-burst.active .sparkle-particle {
          animation: particleTwinkle 0.9s ease-out forwards;
        }

        /* Sound wave burst — concentric rings expanding from center (cry played) */
        .sound-wave-burst {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sound-wave-ring {
          position: absolute;
          border-style: solid;
          border-color: ${T.accent};
          border-radius: 999px;
          opacity: 0;
        }

        .sound-wave-ring:nth-child(1) { width: 24px; height: 24px; border-width: 2px; animation-delay: 0ms; }
        .sound-wave-ring:nth-child(2) { width: 16px; height: 16px; border-width: 1.5px; animation-delay: 120ms; }
        .sound-wave-ring:nth-child(3) { width: 10px; height: 10px; border-width: 1px; animation-delay: 240ms; }

        .sound-wave-burst.active .sound-wave-ring {
          animation: sound-wave-ripple 0.9s ease-out;
        }

        @keyframes particleTwinkle {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(0); }
        }

        @keyframes sound-wave-ripple {
          0%   { opacity: 0.8; transform: scale(0.4); }
          70%  { opacity: 0.35; }
          100% { opacity: 0; transform: scale(2.6); }
        }

        /* S6: the shadow DOM gets its own copy of the rule — a page's
           reduced-motion preference does not cross the shadow boundary.
           The walk itself is product behaviour and keeps running; only the
           decorative motion is neutralised, and the XP badge / sparkles
           are pinned visible (JS still retires them on its timer) so
           "reduce" never becomes "flash once and vanish". */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }

          .xp-badge {
            animation: none;
            opacity: 1;
            transform: translateX(-50%);
          }

          .sparkle-burst.active .sparkle-particle,
          .sound-wave-burst.active .sound-wave-ring {
            animation: none;
            opacity: 1;
          }
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
            <button id="btn-open-pokedex" title="${getStrings('en').petLocateTitle}" aria-label="${getStrings('en').petLocateTitle}">${LOCATE_ICON}</button>
          </div>
          <div class="xp-track">
            <div id="xp-fill" class="xp-fill"></div>
          </div>
          <div id="xp-text" class="xp-text">0 / 500 XP</div>
        </div>

        <div id="sprite-container">
          <img id="pokemon-sprite" alt="pokemon" />
          <div id="sparkle-burst" class="sparkle-burst">
            <span class="sparkle-particle"></span>
            <span class="sparkle-particle"></span>
            <span class="sparkle-particle"></span>
            <span class="sparkle-particle"></span>
            <span class="sparkle-particle"></span>
          </div>
          <div id="sound-wave-burst" class="sound-wave-burst">
            <span class="sound-wave-ring"></span>
            <span class="sound-wave-ring"></span>
            <span class="sound-wave-ring"></span>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(this.host)
    // Fresh DOM: force a full render so the new <img> gets its src even if
    // nothing about the pokemon changed while it was hidden.
    this.lastRenderedKey = ''
    this.lastXpKey = ''
    this.lastFlip = 1
    this.cacheElements()
    this.attachEvents()
  }

  // Single place that resolves every element the pet touches; run once per
  // mount (and cleared on remove) so updates never re-query the DOM.
  private cacheElements(): void {
    if (!this.shadow) return
    const wrapper = this.shadow.getElementById('pet-wrapper')
    const sprite = this.shadow.getElementById('pokemon-sprite') as HTMLImageElement | null
    if (!wrapper || !sprite) return
    this.els = {
      wrapper,
      sprite,
      name: this.shadow.getElementById('pet-name') ?? wrapper,
      shiny: this.shadow.getElementById('pet-shiny'),
      types: this.shadow.getElementById('pet-types'),
      xpFill: this.shadow.getElementById('xp-fill') ?? wrapper,
      xpText: this.shadow.getElementById('xp-text') ?? wrapper,
      pokedexBtn: this.shadow.getElementById('btn-open-pokedex'),
      xpBarContainer: this.shadow.getElementById('xp-bar-container'),
    }
  }

  // Moves the wrapper with a single compositor-friendly transform write
  // (no left/bottom layout invalidation). posY is a bottom offset, hence
  // the negated Y.
  private applyTransform(): void {
    const els = this.els
    if (!els) return
    els.wrapper.style.transform = `translate3d(${this.posX}px, ${-this.posY}px, 0)`
  }

  // Writes the sprite flip only when the direction actually changed.
  private applyFlip(): void {
    const els = this.els
    if (!els) return
    const flip: 1 | -1 = this.direction === 'right' ? 1 : -1
    if (flip === this.lastFlip) return
    this.lastFlip = flip
    els.sprite.style.transform = `scaleX(${flip}) scale(1)`
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

    // Open Pokechidex — locate the active pokemon in it (nothing to find
    // while still inside the Pokeball, so the button stays hidden then)
    pokedexBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      const pokemon = this.state?.pokemon
      if (!pokemon || pokemon.level === 0) {
        void sendPokechiMessage({ type: 'OPEN_POKEDEX' })
        return
      }
      void sendPokechiMessage({
        type: 'OPEN_POKEDEX',
        pokemonType: pokemon.type,
        isShiny: pokemon.color === PokemonColor.shiny,
      })
    })

    // Drag and Drop
    wrapper.addEventListener('mousedown', (e) => {
      // Don't initiate drag if clicking the pokechidex button (or its icon)
      const target = e.target as HTMLElement
      if (target.closest && target.closest('#btn-open-pokedex')) return

      this.isDragging = false
      this.dragStartX = e.clientX - this.posX
      this.dragStartY = e.clientY - (window.innerHeight - this.posY)

      const onMouseMove = (moveEvent: MouseEvent) => {
        this.isDragging = true
        this.posX = Math.max(10, Math.min(window.innerWidth - 80, moveEvent.clientX - this.dragStartX))
        const rawY = window.innerHeight - (moveEvent.clientY - this.dragStartY)
        this.posY = Math.max(10, Math.min(window.innerHeight - 120, rawY))
        this.applyTransform()
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

  // Restart the walk loop after a remove() (visibility toggle) without
  // churning the interval on every plain state update.
  private ensureLoop(): void {
    if (this.intervalId === undefined) {
      this.startLoop()
    }
  }

  private tick(): void {
    if (!this.shadow || !this.state?.pokemon || this.isHovered || this.isDragging) {
      return
    }

    const els = this.els
    if (!els) return

    // Let the idle animation play after an evolution before walking again.
    if (Date.now() < this.idleUntil) {
      if (!this.idleWindowNotified) {
        this.idleWindowNotified = true
        this.lastRenderedKey = '' // force sprite refresh into idle
        this.updateDisplay()
      }
      return
    }
    if (this.idleWindowNotified) {
      this.idleWindowNotified = false
      this.lastRenderedKey = '' // force sprite refresh back into walk
      this.updateDisplay()
    }

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

    this.applyTransform()

    // Keep the sprite facing the walk direction — updateDisplay only runs on
    // state changes, so without this the flip would lag until the next hover.
    // Writes only happen when the direction flipped (applyFlip guards it).
    this.applyFlip()
  }

  public updateDisplay(): void {
    const els = this.els
    if (!els || !this.state?.pokemon) return

    const pokemon = this.state.pokemon
    const { sprite, name: nameEl, shiny: shinyEl, types: typesEl, xpFill, xpText, pokedexBtn, xpBarContainer } = els

    // 1. Name, shiny star, types, and the locate-in-Pokechidex shortcut.
    // Still inside its Pokeball, a pokemon has not been revealed yet, so
    // there is nothing to find in the Pokechidex — hide that button.
    const isRevealed = pokemon.level > 0
    if (pokedexBtn) {
      const locateLabel = getStrings(
        this.state.settings?.language || 'en'
      ).petLocateTitle
      ;(pokedexBtn as HTMLElement).style.display = isRevealed ? '' : 'none'
      // L5/S8: the icon-only shortcut carries both a tooltip and an
      // explicit accessible name in the running language.
      ;(pokedexBtn as HTMLElement).title = locateLabel
      ;(pokedexBtn as HTMLElement).setAttribute('aria-label', locateLabel)
    }

    // Rarity class for the XP bar container border
    if (xpBarContainer) {
      const data = POKEMON_DATA[pokemon.type]
      const rarity = data?.rarity
      // Remove all existing rarity classes
      xpBarContainer.classList.remove('rarity-sub-legendary', 'rarity-legendary', 'rarity-mythical', 'rarity-fossil')
      if (rarity) {
        xpBarContainer.classList.add(`rarity-${rarity}`)
      }
    }

    // Name, shiny star, and types
    if (pokemon.level === 0) {
      nameEl.textContent = getStrings(this.state.settings?.language || 'en').popupLevelEgg
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
          // L5: abbreviations follow the running language, colors don't.
          const badges = getLocalizedTypeBadges(
            getStrings(this.state.settings?.language || 'en').typeAbbreviations
          )
          typesEl.innerHTML = pokemon.types
            .map((t) => {
              const badge = badges[t as PokemonElementType] ?? TYPE_BADGES[t as PokemonElementType]
              return badge ? `<span class="mini-type-badge type-${t}">${badge.abbr}</span>` : ''
            })
            .join('')
        }
      }
    }

    // 2. XP Bar — written only when the values actually changed, so plain
    // state broadcasts (settings, roster, ...) don't touch the style at all.
    const reqXP = getRequiredXPForLevel(pokemon.level)
    const currentXP = pokemon.xp

    // Check if this evolution line is maxed out (fully evolved or already completed)
    const evolutionLine = pokemon.evolutionLine
      ? resolveEvolutionLine(pokemon.evolutionLine as PokemonType[])
      : getEvolutionLineContaining(pokemon.type)
    const isMaxed = evolutionLine
      ? isEvolutionLineMaxed(evolutionLine, pokemon.level, this.state?.pokedex ?? [])
      : false

    // Key includes isMaxed so the bar updates when the maxed state changes
    const xpKey = isMaxed ? `MAX|${currentXP}/${reqXP}` : `${currentXP}/${reqXP}`
    if (xpKey !== this.lastXpKey) {
      this.lastXpKey = xpKey
      if (isMaxed) {
        xpFill.style.width = '100%'
        xpFill.style.background = 'linear-gradient(90deg, var(--gold), var(--gold-dim))'
        xpText.textContent = getStrings(this.state?.settings?.language || 'en').xpMax
      } else {
        const percent = Math.min(100, Math.floor((currentXP / reqXP) * 100))
        xpFill.style.width = `${percent}%`
        xpFill.style.background = 'var(--grad-xp)'
        xpText.textContent = `${trimXPDecimals(currentXP)} / ${reqXP} XP`
      }
    }

    // 3. Sprite image — idle while hovered or right after an evolution
    const isIdle = this.isHovered || pokemon.level === 0 || Date.now() < this.idleUntil
    const spriteUrl = this.getSpriteUrl(pokemon, isIdle)
    const scale = this.state.settings?.scaleFactor || 1

    const renderKey = `${spriteUrl}|${isIdle}|${scale}`
    if (renderKey !== this.lastRenderedKey) {
      this.lastRenderedKey = renderKey
      sprite.src = spriteUrl
      // S8: the sprite's own accessible name. An unrevealed pokemon has no
      // name yet, so it describes the Pokeball it still is inside.
      sprite.alt = pokemon.name || 'Pokéball'

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

    // 4. Flip direction in tick (not in updateDisplay); guarded so it only
    // writes when the facing actually changed.
    this.applyFlip()
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
    // The host can be detached (petVisible off) while XP events still arrive
    // — no visible pet means no sound either.
    if (!this.shadow) return
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
    const sparkleBurst = this.shadow.getElementById('sparkle-burst')
    const soundWaveBurst = this.shadow.getElementById('sound-wave-burst')
    for (const burst of [sparkleBurst, soundWaveBurst]) {
      if (burst) {
        burst.classList.remove('active')
        void burst.offsetWidth
        burst.classList.add('active')
        setTimeout(() => {
          burst.classList.remove('active')
        }, 1000)
      }
    }
  }

  private triggerEvolveEffect(): void {
    this.triggerSparkle()
    this.playCry()
    this.showXPNotification(0, 'evolution', 'evolve-toast')
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

  private showXPNotification(amount: number, reason: string, extraClass = ''): void {
    if (!this.shadow) return
    const container = this.shadow.getElementById('sprite-container')
    if (!container) return

    const badge = document.createElement('div')
    badge.className = extraClass ? `xp-badge ${extraClass}` : 'xp-badge'

    // L5: the label comes from the language dictionary keyed by XP reason;
    // an unknown reason falls back to a plain "+N XP". Amounts are trimmed
    // to 2 decimals so fractional multipliers never print float dust.
    const strings = getStrings(this.state?.settings?.language || 'en')
    const label = strings.xpReasonLabels[reason]?.(trimXPDecimals(amount)) ?? `+${trimXPDecimals(amount)} XP`

    badge.textContent = label
    container.appendChild(badge)

    setTimeout(() => {
      badge.remove()
    }, 1500)
  }

  // L11: ephemeral "🏅 <badge name>" toast when a milestone is completed —
  // same lifecycle and styling as the +N XP badge, but a separate element
  // so a badge and an XP gain can appear together.
  private showBadgeNotification(badgeName: string): void {
    if (!this.shadow) return
    const container = this.shadow.getElementById('sprite-container')
    if (!container) return

    const strings = getStrings(this.state?.settings?.language || 'en')
    const toast = document.createElement('div')
    toast.className = 'xp-badge badge-toast'
    toast.textContent = strings.badgeEarned(badgeName)
    container.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 2500)
  }

  // Retos: ephemeral "🏆 <challenge name>" toast when a challenge is
  // completed — same gold badge-toast styling and lifecycle as milestones.
  private showChallengeNotification(challengeId: string): void {
    if (!this.shadow) return
    const container = this.shadow.getElementById('sprite-container')
    if (!container) return

    const strings = getStrings(this.state?.settings?.language || 'en')
    const toast = document.createElement('div')
    toast.className = 'xp-badge badge-toast'
    toast.textContent = strings.challengeEarned(getChallengeDisplay(challengeId, strings).name)
    container.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 2500)
  }

  public remove(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    this.idleUntil = 0
    this.idleWindowNotified = false
    if (this.xpBarHideTimer) {
      window.clearTimeout(this.xpBarHideTimer)
      this.xpBarHideTimer = undefined
    }
    // A pointer can hover the pet exactly when it is hidden; a stale flag
    // would make tick() park the freshly re-mounted pet forever (no mouseenter
    // fires for an element the pointer already rests on).
    this.isHovered = false
    this.isDragging = false
    if (this.host) {
      this.host.remove()
      this.host = null
      this.shadow = null
    }
    this.els = null
  }
}
