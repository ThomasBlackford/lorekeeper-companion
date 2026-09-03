import { Repeat, Sparkles } from 'lucide-react'
import type { Spell } from '../types'

interface Props {
  spell: Spell
  isConcentrating: boolean
  onTogglePrepared: () => void
  onToggleConcentration: () => void
  onEdit: () => void
}

export function SpellRow({ spell, isConcentrating, onTogglePrepared, onToggleConcentration, onEdit }: Props) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors">
      <span className="w-6 h-6 flex-shrink-0 rounded-full bg-surface-overlay flex items-center justify-center text-[10px] font-bold text-slate-400">
        {spell.level === 0 ? 'C' : spell.level}
      </span>

      <button onClick={onEdit} className="flex-1 min-w-0 text-left">
        <span className="text-sm text-slate-200 truncate">{spell.name}</span>
      </button>

      {spell.concentration && (
        <button
          onClick={onToggleConcentration}
          title={isConcentrating ? 'Concentrating on this — click to drop' : 'Mark as your active concentration'}
          className={`flex-shrink-0 transition-colors ${isConcentrating ? 'text-purple-300' : 'text-purple-400/40 hover:text-purple-400'}`}
        >
          <Sparkles size={12} fill={isConcentrating ? 'currentColor' : 'none'} />
        </button>
      )}
      {spell.ritual && (
        <span title="Ritual" className="flex-shrink-0">
          <Repeat size={12} className="text-sky-400" />
        </span>
      )}

      <label className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0 cursor-pointer">
        <input type="checkbox" checked={spell.prepared} onChange={onTogglePrepared} /> Prep
      </label>
    </div>
  )
}
