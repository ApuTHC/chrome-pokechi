import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// V2/V3: the YouTube tracker is the only XP rule that runs against a DOM it
// does not own, so the suite drives it with a fake <video> and asserts on the
// ADD_XP message the service worker would receive. Each test boots a fresh
// module instance (vi.resetModules) because the tracker keeps its credit set
// and its watch counters at module scope.

const WATCH_A = 'https://www.youtube.com/watch?v=AAAAAAAAAAA'
const WATCH_B = 'https://www.youtube.com/watch?v=BBBBBBBBBBB'
const XP_MESSAGE = { type: 'ADD_XP', amount: 10, reason: 'youtube_song' }

class FakeVideo {
  currentTime = 0
  duration = 200
  private listeners = new Map<string, Set<() => void>>()

  addEventListener(type: string, handler: () => void): void {
    const handlers = this.listeners.get(type) ?? new Set<() => void>()
    handlers.add(handler)
    this.listeners.set(type, handlers)
  }

  removeEventListener(type: string, handler: () => void): void {
    this.listeners.get(type)?.delete(handler)
  }

  emit(type: string): void {
    for (const handler of [...(this.listeners.get(type) ?? [])]) handler()
  }

  get listenerCount(): number {
    let total = 0
    for (const handlers of this.listeners.values()) total += handlers.size
    return total
  }
}

interface Harness {
  /** Main player element currently reported by #movie_player. */
  readonly video: FakeVideo
  /** Swaps the element the player reports, as YouTube does when it rebuilds. */
  setVideo(video: FakeVideo): void
  location: { href: string; hostname: string }
  sendMessage: Mock
  /** Samples the tracker the way `timeupdate` does, one position at a time. */
  play(...times: number[]): void
  /** Fires a media event on the current element (`ended`, ...). */
  emit(type: string): void
  /** Fires the capture-phase `play` listener the tracker registers on document. */
  fireDocumentPlay(): void
  /** Fires YouTube's SPA navigation event for the current URL. */
  fireNavigateFinish(): void
}

async function boot(options: { href: string; preview?: FakeVideo }): Promise<Harness> {
  vi.resetModules()

  const location = { href: options.href, hostname: new URL(options.href).hostname }
  const listeners = new Map<string, () => void>()
  const sendMessage = vi.fn(async () => ({ success: true }))
  const main = { current: new FakeVideo() }

  vi.stubGlobal('window', {
    location,
    addEventListener: (type: string, handler: () => void) => {
      listeners.set(`window:${type}`, handler)
    },
  })
  vi.stubGlobal('document', {
    querySelector: (selector: string) => {
      if (selector === '#movie_player video') return main.current
      if (selector === 'video') return options.preview ?? null
      return null
    },
    documentElement: {},
    addEventListener: (type: string, handler: () => void) => {
      listeners.set(type, handler)
    },
  })
  vi.stubGlobal('chrome', { runtime: { sendMessage } })

  const { initYouTubeTracker } = await import('./youtube-tracker')
  initYouTubeTracker()

  return {
    get video() {
      return main.current
    },
    setVideo: (next: FakeVideo) => {
      main.current = next
    },
    location,
    sendMessage,
    play: (...times: number[]) => {
      for (const time of times) {
        main.current.currentTime = time
        main.current.emit('timeupdate')
      }
    },
    emit: (type: string) => main.current.emit(type),
    fireDocumentPlay: () => listeners.get('play')?.(),
    fireNavigateFinish: () => listeners.get('window:yt-navigate-finish')?.(),
  }
}

beforeEach(() => {
  // The tracker logs its lifecycle ([Pokechi] YouTube: ...) for the manual
  // diagnosis in the field; keep the reporter output clean.
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('youtube-tracker', () => {
  it('credits a song watched to the end, but not twice for one playthrough', async () => {
    const h = await boot({ href: WATCH_A })
    h.play(0.2, 60, 150, 196)

    expect(h.sendMessage).toHaveBeenCalledTimes(1)
    expect(h.sendMessage).toHaveBeenCalledWith(XP_MESSAGE)

    // The timeupdate rule already paid: the tail and `ended` must not add up.
    h.play(197, 199)
    h.emit('ended')
    expect(h.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('pays again every time the same song is finished (per playthrough)', async () => {
    const h = await boot({ href: WATCH_A })
    h.play(0.2, 60, 150, 196)
    expect(h.sendMessage).toHaveBeenCalledTimes(1)

    // The media starts over (replay/loop/seek to the top) and is watched again.
    h.play(0.2, 60, 150, 196)
    expect(h.sendMessage).toHaveBeenCalledTimes(2)

    // Still one credit per run: `ended` closes the second one without paying.
    h.emit('ended')
    expect(h.sendMessage).toHaveBeenCalledTimes(2)
    expect(h.sendMessage).toHaveBeenCalledWith(XP_MESSAGE)
  })

  it('credits a song opened past its start (resume or seek before playing)', async () => {
    const h = await boot({ href: WATCH_A })
    // The first sample is already deep into the video: the stale guard used
    // to latch here and swallow every credit for the whole session.
    h.play(120, 150, 196)

    expect(h.sendMessage).toHaveBeenCalledTimes(1)
    expect(h.sendMessage).toHaveBeenCalledWith(XP_MESSAGE)
  })

  it("never credits the new id with the previous video's tail", async () => {
    const h = await boot({ href: WATCH_A })
    h.play(0.2, 60)

    // SPA navigation: the URL flips while the player still shows video A.
    h.location.href = WATCH_B
    h.fireNavigateFinish()
    h.play(100, 150, 196)
    expect(h.sendMessage).not.toHaveBeenCalled()

    // Video B's own media starts over and is watched to the end.
    h.play(0.2, 60, 196)
    expect(h.sendMessage).toHaveBeenCalledTimes(1)
    expect(h.sendMessage).toHaveBeenCalledWith(XP_MESSAGE)
  })

  it('credits the media that ended even when autoplay already flipped the URL', async () => {
    const h = await boot({ href: WATCH_A })
    h.play(0.2, 60, 150) // 75% watched: not enough for the timeupdate rule

    h.location.href = WATCH_B
    h.emit('ended')

    expect(h.sendMessage).toHaveBeenCalledTimes(1)
    expect(h.sendMessage).toHaveBeenCalledWith(XP_MESSAGE)
  })

  it('credits on ended once 60% of the song was watched', async () => {
    const h = await boot({ href: WATCH_A })
    h.play(0.2, 60, 150)
    h.emit('ended')

    expect(h.sendMessage).toHaveBeenCalledTimes(1)
    expect(h.sendMessage).toHaveBeenCalledWith(XP_MESSAGE)
  })

  it('keeps tracking after the player swaps the <video> element', async () => {
    const h = await boot({ href: WATCH_A })
    const first = h.video
    h.play(0.2)
    expect(first.listenerCount).toBe(2)

    const rebuilt = new FakeVideo()
    h.setVideo(rebuilt)
    h.fireDocumentPlay() // the new element starts playing

    expect(first.listenerCount).toBe(0) // listeners left the detached node
    expect(rebuilt.listenerCount).toBe(2)

    h.play(0.2, 196)
    expect(h.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('attaches to the main player instead of the first preview video', async () => {
    const preview = new FakeVideo()
    const h = await boot({ href: WATCH_A, preview })

    expect(preview.listenerCount).toBe(0)
    h.play(0.2, 196)
    expect(h.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('ignores a video without an id (home, search, shorts)', async () => {
    const h = await boot({ href: 'https://www.youtube.com/' })
    h.play(0.2, 60, 196)
    h.emit('ended')

    expect(h.sendMessage).not.toHaveBeenCalled()
  })
})
