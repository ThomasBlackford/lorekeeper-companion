import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

// Only ever appears once an update has finished downloading in the
// background — installing is always the player's own click, never
// automatic, so it can't interrupt a live session.
export function UpdateBanner() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    window.api.updater.status().then((s) => setReady(s.ready))
    return window.api.updater.onReady(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-3 bg-amber-500/90 text-slate-900 text-xs font-medium py-1.5">
      <RefreshCw size={13} />
      An update has downloaded and is ready.
      <button
        onClick={() => window.api.updater.install()}
        className="underline hover:no-underline font-semibold"
      >
        Restart to update
      </button>
    </div>
  )
}
