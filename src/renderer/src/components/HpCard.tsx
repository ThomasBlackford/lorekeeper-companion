import { useState, useEffect } from 'react'
import { Minus, Plus, Skull } from 'lucide-react'
import type { Character } from '../types'

interface Props {
  character: Character
  onChange: (changes: { hp_current?: number | null; hp_max?: number | null }) => void
}

export function HpCard({ character, onChange }: Props) {
  const [current, setCurrent] = useState(String(character.hp_current ?? ''))
  const [max, setMax] = useState(String(character.hp_max ?? ''))
  const [delta, setDelta] = useState('')

  useEffect(() => setCurrent(String(character.hp_current ?? '')), [character.hp_current])
  useEffect(() => setMax(String(character.hp_max ?? '')), [character.hp_max])

  function commitCurrent() {
    const val = parseInt(current)
    onChange({ hp_current: isNaN(val) ? null : val })
  }

  function commitMax() {
    const val = parseInt(max)
    onChange({ hp_max: isNaN(val) ? null : val })
  }

  function applyDelta(sign: 1 | -1) {
    const amount = Math.abs(parseInt(delta))
    if (!amount) return
    const base = character.hp_current ?? 0
    let next = base + sign * amount
    next = Math.max(0, next)
    if (character.hp_max != null) next = Math.min(character.hp_max, next)
    onChange({ hp_current: next })
  }

  const isDown = character.hp_current != null && character.hp_current <= 0

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Hit Points</h2>
        {isDown && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Skull size={12} /> Down
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <input
          className="w-20 text-center text-2xl font-display font-semibold bg-surface-overlay border border-border rounded-lg py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onBlur={commitCurrent}
          onKeyDown={(e) => e.key === 'Enter' && commitCurrent()}
        />
        <span className="text-slate-600 text-xl">/</span>
        <input
          className="w-16 text-center text-lg bg-surface-overlay border border-border rounded-lg py-1.5 text-slate-400 focus:outline-none focus:border-amber-500/60"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onBlur={commitMax}
          onKeyDown={(e) => e.key === 'Enter' && commitMax()}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => applyDelta(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          title="Take damage"
        >
          <Minus size={16} />
        </button>
        <input
          className="w-14 text-center text-sm bg-surface-overlay border border-border rounded-lg py-1.5 text-slate-300 focus:outline-none focus:border-amber-500/60"
          value={delta}
          onChange={(e) => setDelta(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && applyDelta(-1)}
          placeholder="0"
        />
        <button
          onClick={() => applyDelta(1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          title="Heal"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
