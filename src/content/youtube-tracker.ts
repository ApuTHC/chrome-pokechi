// Tracks completed YouTube songs/videos (10 pts)
//
// The <video> element is located through a MutationObserver instead of a
// 1.5s setTimeout poll, and its listeners are attached exactly once per
// element: YouTube reuses the same <video> across SPA navigations, so
// re-attaching on every yt-navigate-finish used to stack duplicate
// timeupdate handlers (and risk duplicate XP credits).

import { sendPokechiMessage } from '../common/messages'

let currentVideoId = ''
let maxWatchedTime = 0
// One credit per PLAYTHROUGH, not one per video id: set when the current run
// has been paid, cleared when the media starts over (replay, loop, seek back
// to the top) or when the id changes. It keeps the timeupdate rule and the
// `ended` rule below from paying twice for the same finish, while letting a
// replayed song pay again.
let creditedThisRun = false
// Last position reported by the ATTACHED element (-1 before its first
// sample). It survives SPA navigations, because the element usually is the
// same one, and it is reset when the element itself is swapped: a backwards
// jump is the only reliable signal that YouTube loaded new media.
let lastTime = -1
// The URL flips before the player swaps its media, so a timeupdate can still
// carry the PREVIOUS video's position. Until the element rewinds — or a
// freshly attached element reports its first position — nothing is recorded
// or credited for the new id. The guard can no longer latch forever: every
// sample either proves the media changed (backwards jump, first sample of a
// newly attached element) or sits under 3s, and all three clear it. The old
// version only cleared on "position under 3s", so a first sample at 3s or
// more (resume, `&t=` link, seek before playing) disabled XP for the session.
let staleUntilRewind = false

let attachedVideo: HTMLVideoElement | null = null
let timeUpdateHandler: (() => void) | null = null
let endedHandler: (() => void) | null = null
let observer: MutationObserver | null = null

// Prefer the main player: search/home pages can render muted preview videos
// first in document order, and attaching to those silently stops all XP.
function findPlayerVideo(): HTMLVideoElement | null {
  return (
    document.querySelector<HTMLVideoElement>('#movie_player video') ??
    document.querySelector<HTMLVideoElement>('video')
  )
}

function getVideoId(): string {
  const url = new URL(window.location.href)
  return url.searchParams.get('v') || ''
}

// Keeps the tracked video id in sync with the URL; a new id resets the
// "how far did they actually watch" high-water mark and opens the stale
// window above.
function checkUrl(): void {
  const vid = getVideoId()
  if (vid !== currentVideoId) {
    currentVideoId = vid
    maxWatchedTime = 0
    creditedThisRun = false
    staleUntilRewind = true
  }
}

function handleVideoCompleted(): void {
  if (creditedThisRun) return
  creditedThisRun = true
  console.log('[Pokechi] YouTube: song finished -> +10 XP')
  void sendPokechiMessage({ type: 'ADD_XP', amount: 10, reason: 'youtube_song' })
}

function handleTimeUpdate(video: HTMLVideoElement): void {
  checkUrl()

  const time = video.currentTime
  const previousTime = lastTime
  lastTime = time

  // Stale window: the element may still be showing the previous video.
  if (staleUntilRewind) {
    // It is current media only once its position says so: it jumped
    // backwards (the new video starting over) or this is the first sample of
    // an element attached after the navigation. A position still walking
    // forward from 3s on belongs to the previous id.
    const mediaSwapped = previousTime < 0 || time < previousTime
    if (!mediaSwapped && time >= 3) return
    staleUntilRewind = false
  }

  if (!currentVideoId) return

  // The media started over (loop, replay button, seek back to the top): that
  // is a new playthrough, so its counters — and its credit — start from zero.
  if (previousTime >= 3 && time < 3) {
    maxWatchedTime = 0
    creditedThisRun = false
  }

  if (time > maxWatchedTime) {
    maxWatchedTime = time
  }

  // If duration is valid and user has played past 92%...
  if (video.duration > 15) {
    const percent = time / video.duration
    // ...verify watched time matches at least 70% of duration so they
    // didn't just fast-forward to 99%.
    if (percent >= 0.92 && maxWatchedTime >= video.duration * 0.7) {
      handleVideoCompleted()
    }
  }
}

function handleEnded(video: HTMLVideoElement): void {
  // `ended` describes the media that just finished, and autoplay-next can flip
  // the URL before the player reports it: settle the credit with the id and
  // the watched position of THAT media first, and only then re-sync with the
  // URL (which opens the stale window and clears the flag for the next run).
  const endedVideoId = currentVideoId
  const endedMaxWatchedTime = maxWatchedTime
  if (endedVideoId && video.duration > 15 && endedMaxWatchedTime >= video.duration * 0.6) {
    handleVideoCompleted()
  }
  checkUrl()
}

function detachVideo(): void {
  if (attachedVideo) {
    if (timeUpdateHandler) attachedVideo.removeEventListener('timeupdate', timeUpdateHandler)
    if (endedHandler) attachedVideo.removeEventListener('ended', endedHandler)
  }
  attachedVideo = null
  timeUpdateHandler = null
  endedHandler = null
}

// No-op when the element is already the attached one — navigating 10 videos
// in a row keeps exactly one timeupdate and one ended listener.
function attachTo(video: HTMLVideoElement): void {
  if (video === attachedVideo) return
  detachVideo()
  // A different element cannot be carrying the old media, so its first
  // position is trustworthy (the stale guard above waits for exactly that).
  lastTime = -1
  timeUpdateHandler = () => handleTimeUpdate(video)
  endedHandler = () => handleEnded(video)
  video.addEventListener('timeupdate', timeUpdateHandler)
  video.addEventListener('ended', endedHandler)
  attachedVideo = video
  console.log('[Pokechi] YouTube: tracking <video>')
}

// Arms a one-shot observer that waits for a <video> to appear, then goes
// away — no polling loop left running.
function watchForVideo(): void {
  const existing = findPlayerVideo()
  if (existing) {
    attachTo(existing)
    return
  }
  if (observer) return
  observer = new MutationObserver(() => {
    const video = findPlayerVideo()
    if (video) {
      observer?.disconnect()
      observer = null
      attachTo(video)
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

export function initYouTubeTracker(): void {
  if (!window.location.hostname.includes('youtube.com')) {
    return
  }

  watchForVideo()

  // The observer above disarms after the first match, but the player swaps
  // its <video> in place from time to time — then every listener was left on
  // a detached node and XP silently stopped for the whole session. Re-check
  // on 'play' (capture, so it reaches any player) instead of polling:
  // playback is the only thing that can earn XP anyway.
  document.addEventListener('play', () => watchForVideo(), { capture: true })

  // Handle YouTube SPA navigation: reset the watch high-water mark for the
  // new video id, and re-attach only if the <video> element itself changed.
  window.addEventListener('yt-navigate-finish', () => {
    checkUrl()
    const video = findPlayerVideo()
    if (video) {
      attachTo(video)
    } else {
      watchForVideo()
    }
  })
}
