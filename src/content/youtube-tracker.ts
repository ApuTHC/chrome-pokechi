// Tracks completed YouTube songs/videos (10 pts)
//
// The <video> element is located once through a MutationObserver instead of
// a 1.5s setTimeout poll, and its listeners are attached exactly once per
// element: YouTube reuses the same <video> across SPA navigations, so
// re-attaching on every yt-navigate-finish used to stack duplicate
// timeupdate handlers (and risk duplicate XP credits).

import { sendPokechiMessage } from '../common/messages'

const creditedVideos = new Set<string>()
let currentVideoId = ''
let maxWatchedTime = 0
// The URL flips before the player swaps its media, so a timeupdate can still
// carry the PREVIOUS video's position. Until the element rewinds to the start
// of the new media, nothing is recorded or credited for the new id.
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
// "how far did they actually watch" high-water mark.
function checkUrl(): void {
  const vid = getVideoId()
  if (vid !== currentVideoId) {
    currentVideoId = vid
    maxWatchedTime = 0
    staleUntilRewind = true
  }
}

function handleVideoCompleted(videoId: string): void {
  if (!videoId || creditedVideos.has(videoId)) {
    return
  }

  creditedVideos.add(videoId)
  void sendPokechiMessage({ type: 'ADD_XP', amount: 10, reason: 'youtube_song' })
}

function handleTimeUpdate(video: HTMLVideoElement): void {
  checkUrl()
  if (!currentVideoId || creditedVideos.has(currentVideoId)) return

  // Still showing the previous video's position — skip it entirely (max stays
  // 0, so the credit check below cannot pass either).
  if (staleUntilRewind) {
    if (video.currentTime >= 3) return
    staleUntilRewind = false
  }

  if (video.currentTime > maxWatchedTime) {
    maxWatchedTime = video.currentTime
  }

  // If duration is valid and user has played past 92%...
  if (video.duration > 15) {
    const percent = video.currentTime / video.duration
    // ...verify watched time matches at least 70% of duration so they
    // didn't just fast-forward to 99%.
    if (percent >= 0.92 && maxWatchedTime >= video.duration * 0.7) {
      handleVideoCompleted(currentVideoId)
    }
  }
}

function handleEnded(video: HTMLVideoElement): void {
  checkUrl()
  if (video.duration > 15 && maxWatchedTime >= video.duration * 0.6) {
    handleVideoCompleted(currentVideoId)
  }
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
  timeUpdateHandler = () => handleTimeUpdate(video)
  endedHandler = () => handleEnded(video)
  video.addEventListener('timeupdate', timeUpdateHandler)
  video.addEventListener('ended', endedHandler)
  attachedVideo = video
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
