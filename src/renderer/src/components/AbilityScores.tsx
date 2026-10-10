import type { AbilityScoreKey, Character } from '../types'
import { NumberField } from './NumberField'
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
            <NumberField
              className="w-12 text-center text-lg font-display font-semibold bg-transparent text-slate-100 focus:outline-none"
              value={score}
              min={1}
              max={30}
              onCommit={(v) => onChange(s.key, v)}
            />
            <span className="text-xs text-amber-400/80">{fmtMod(abilityMod(score))}</span>
          </div>
        )
      })}
    </div>
  )
}
