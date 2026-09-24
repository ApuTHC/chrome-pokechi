// Site-specific trackers, bundled separately so they only run where they
// matter (R10): manifest.json injects this file on youtube.com / mail.google.com
// only, instead of loading both trackers on every page via <all_urls>.
import { initYouTubeTracker } from './youtube-tracker'
import { initGmailTracker } from './gmail-tracker'

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initYouTubeTracker()
    initGmailTracker()
  })
} else {
  initYouTubeTracker()
  initGmailTracker()
}
