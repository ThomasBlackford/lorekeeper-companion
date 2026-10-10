import { useEffect, useState } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'
import { onNotify } from '../lib/notify'

interface Toast {
  id: number
  message: string
  kind: 'error' | 'info'
}

let nextId = 1

// Bottom-left stack of dismissible error messages — failures that used to be
// silent (an IPC call rejecting, so the form just sat there) now say so.
export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(
    () =>
      onNotify((message, kind) => {
        const id = nextId++
        setToasts((t) => [...t.slice(-3), { id, message, kind }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 8000 : 6000)
      }),
    []
  )

  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`animate-popover flex items-start gap-2 bg-surface-raised border px-3 py-2.5 shadow-2xl ${
            t.kind === 'error' ? 'border-red-500/40' : 'border-amber-500/40'
          }`}
        >
          {t.kind === 'error' ? (
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-xs text-slate-200 leading-relaxed flex-1">{t.message}</p>
          <button
            onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
            className="text-slate-500 hover:text-slate-200 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
