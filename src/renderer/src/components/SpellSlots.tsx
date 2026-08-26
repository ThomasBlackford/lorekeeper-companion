import { useState } from 'react'
import type { SpellSlot } from '../types'

interface Props {
  slots: SpellSlot[]
  onChange: (level: number, changes: { max?: number; current?: number }) => void
}

export function SpellSlots({ slots, onChange }: Props) {
  const [editMode, setEditMode] = useState(false)
  const visible = editMode ? slots : slots.filter((s) => s.max > 0)

  return (
    <div>
      <div className="flex flex-wrap gap-2 min-h-[3.25rem] items-center">
        {visible.length === 0 ? (
          <p className="text-xs text-slate-600">No spell slots set.</p>
        ) : (
          visible.map((s) => (
            <div
              key={s.level}
              className="flex flex-col items-center gap-1 bg-surface-overlay border border-border rounded-lg px-2 py-1.5"
            >
              <span className="text-[10px] text-slate-500">Lv {s.level}</span>
              {editMode ? (
                <input
                  type="number"
                  className="w-9 text-center text-xs bg-surface-base border border-border rounded px-0.5 py-0.5 text-slate-300 focus:outline-none focus:border-amber-500/60"
                  value={s.max}
                  min={0}
                  onChange={(e) => onChange(s.level, { max: Math.max(0, parseInt(e.target.value) || 0) })}
                />
              ) : (
                <div className="flex items-center gap-1 text-xs text-slate-300">
                  <button
                    onClick={() => onChange(s.level, { current: Math.max(0, s.current - 1) })}
                    className="w-5 h-5 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{s.current}/{s.max}</span>
                  <button
                    onClick={() => onChange(s.level, { current: Math.min(s.max, s.current + 1) })}
                    className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => setEditMode((v) => !v)}
        className="mt-2 text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
      >
        {editMode ? 'Done' : 'Edit max slots'}
      </button>
    </div>
  )
}
