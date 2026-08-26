import { useState } from 'react'
import { Settings } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'

// Fixed at the bottom-left of the whole app window, independent of
// whatever's scrolled inside the main content column.
export function SettingsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Settings"
        className="fixed bottom-4 left-4 z-40 w-10 h-10 flex items-center justify-center rounded-full
                   bg-surface-raised border border-border text-slate-400 shadow-lg
                   hover:text-amber-300 hover:border-amber-500/40 transition-colors"
      >
        <Settings size={16} />
      </button>
      {open && <SettingsPanel onClose={() => setOpen(false)} />}
    </>
  )
}
