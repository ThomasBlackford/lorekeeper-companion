import { Minus, Plus } from 'lucide-react'
import { fmtMod } from '../lib/dnd'

interface Props {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

// Small +/- control for flat modifiers players nudge by one at a time (feats,
// magic items) — a raw number field invites mental math the tile pattern
// elsewhere in this app already avoids for HP.
export function Stepper({ value, onChange, min = -10, max = 20 }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-6 h-6 flex items-center justify-center rounded border border-border text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
      >
        <Minus size={12} />
      </button>
      <span className="w-8 text-center text-sm font-display font-semibold text-slate-100">{fmtMod(value)}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-6 h-6 flex items-center justify-center rounded border border-border text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
