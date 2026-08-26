import type { AbilityScoreKey, Character } from '../types'

const ABILITY_OPTIONS: { value: AbilityScoreKey; label: string }[] = [
  { value: 'int_score', label: 'Intelligence' },
  { value: 'wis_score', label: 'Wisdom' },
  { value: 'cha_score', label: 'Charisma' }
]

function mod(score: number): number {
  return Math.floor((score - 10) / 2)
}

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

interface Props {
  character: Character
  onChange: (ability: AbilityScoreKey | null) => void
}

export function SpellcastingStats({ character, onChange }: Props) {
  const abilityKey = character.spellcasting_ability
  const abilityMod = abilityKey ? mod(character[abilityKey]) : 0
  const profBonus = character.proficiency_bonus ?? 0
  const spellAttack = abilityMod + profBonus
  const saveDc = 8 + abilityMod + profBonus

  return (
    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <select
        className="input text-xs py-1.5 w-40"
        value={abilityKey ?? ''}
        onChange={(e) => onChange(e.target.value ? (e.target.value as AbilityScoreKey) : null)}
      >
        <option value="">No spellcasting</option>
        {ABILITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {abilityKey && (
        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-sm font-display font-semibold text-slate-100">{fmt(abilityMod)}</p>
            <p className="text-[9px] uppercase tracking-widest text-slate-600">Modifier</p>
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-amber-300">{fmt(spellAttack)}</p>
            <p className="text-[9px] uppercase tracking-widest text-slate-600">Spell Attack</p>
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-slate-100">{saveDc}</p>
            <p className="text-[9px] uppercase tracking-widest text-slate-600">Save DC</p>
          </div>
        </div>
      )}
    </div>
  )
}
