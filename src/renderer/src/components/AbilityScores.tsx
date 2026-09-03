import type { AbilityScoreKey, Character } from '../types'
import { ABILITY_ORDER, ABILITY_SHORT, abilityMod, fmtMod } from '../lib/dnd'

const STATS = ABILITY_ORDER.map((key) => ({ key, label: ABILITY_SHORT[key] }))

interface Props {
  character: Character
  onChange: (key: AbilityScoreKey, value: number) => void
}

export function AbilityScores({ character, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {STATS.map((s) => {
        const score = character[s.key]
        return (
          <div
            key={s.key}
            className="flex flex-col items-center gap-1 bg-surface-overlay border border-border rounded-lg py-2.5"
          >
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{s.label}</span>
            <input
              type="number"
              className="w-12 text-center text-lg font-display font-semibold bg-transparent text-slate-100 focus:outline-none"
              value={score}
              onChange={(e) => onChange(s.key, parseInt(e.target.value) || 0)}
            />
            <span className="text-xs text-amber-400/80">{fmtMod(abilityMod(score))}</span>
          </div>
        )
      })}
    </div>
  )
}
