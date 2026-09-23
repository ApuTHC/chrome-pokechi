// Tracks completed YouTube songs/videos (10 pts)

const creditedVideos = new Set<string>()
let currentVideoId = ''
let maxWatchedTime = 0

function getVideoId(): string {
  const url = new URL(window.location.href)
  return url.searchParams.get('v') || ''
}

export function initYouTubeTracker(): void {
  if (!window.location.hostname.includes('youtube.com')) {
    return
  }

  function handleVideoCompleted(videoId: string): void {
    if (!videoId || creditedVideos.has(videoId)) {
      return
    }

    creditedVideos.add(videoId)
    try {
      chrome.runtime.sendMessage({
        type: 'ADD_XP',
        amount: 10,
        reason: 'youtube_song',
      }).catch(() => {})
    } catch {}
  }

  function observeVideoPlayer(): void {
    const video = document.querySelector('video')
    if (!video) {
      setTimeout(observeVideoPlayer, 1500)
      return
    }

    const checkUrl = () => {
      const vid = getVideoId()
      if (vid !== currentVideoId) {
        currentVideoId = vid
        maxWatchedTime = 0
      }
    }

    video.addEventListener('timeupdate', () => {
      checkUrl()
      if (!currentVideoId || creditedVideos.has(currentVideoId)) return

      if (video.currentTime > maxWatchedTime) {
        maxWatchedTime = video.currentTime
      }

      // If duration is valid and user has played past 90%
      if (video.duration > 15) {
        const percent = video.currentTime / video.duration
        // Verify watched time matches at least 70% of duration so they didn't just fast-forward to 99%
        if (percent >= 0.92 && maxWatchedTime >= video.duration * 0.7) {
          handleVideoCompleted(currentVideoId)
        }
      }
    })

    video.addEventListener('ended', () => {
      checkUrl()
      if (video.duration > 15 && maxWatchedTime >= video.duration * 0.6) {
        handleVideoCompleted(currentVideoId)
      }
    })
  }

  // Handle YouTube SPA navigation
  window.addEventListener('yt-navigate-finish', () => {
    observeVideoPlayer()
  })

  observeVideoPlayer()
}
