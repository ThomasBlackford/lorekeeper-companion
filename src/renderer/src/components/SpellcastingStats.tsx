import type { AbilityScoreKey, Character } from '../types'
import { ABILITY_LABELS, SPELLCASTING_CLASS_OPTIONS, abilityMod, fmtMod } from '../lib/dnd'

const CUSTOM_ABILITY_OPTIONS: AbilityScoreKey[] = ['int_score', 'wis_score', 'cha_score']

interface Props {
  character: Character
  onChange: (changes: { spellcasting_ability: AbilityScoreKey | null; spellcasting_class: string }) => void
}

// The class dropdown is a convenience over the raw ability picker — most
// players know "I'm a Warlock", not "Warlock casts from Charisma". The
// chosen class label is stored separately from the derived ability so two
// classes sharing an ability (e.g. Wizard and Artificer, both Intelligence)
// don't get confused for each other on redisplay.
export function SpellcastingStats({ character, onChange }: Props) {
  const abilityKey = character.spellcasting_ability
  const selectedClass = character.spellcasting_class
  const isCustom = !!abilityKey && !SPELLCASTING_CLASS_OPTIONS.some((o) => o.label === selectedClass)
  const abilityMod_ = abilityKey ? abilityMod(character[abilityKey]) : 0
  const profBonus = character.proficiency_bonus ?? 0
  const spellAttack = abilityMod_ + profBonus
  const saveDc = 8 + abilityMod_ + profBonus

  function handleClassSelect(value: string) {
    if (value === '') {
      onChange({ spellcasting_ability: null, spellcasting_class: '' })
      return
    }
    if (value === 'custom') {
      onChange({ spellcasting_ability: abilityKey ?? 'int_score', spellcasting_class: 'Custom' })
      return
    }
    const found = SPELLCASTING_CLASS_OPTIONS.find((o) => o.label === value)
    onChange({ spellcasting_ability: found ? found.ability : null, spellcasting_class: value })
  }

  function handleCustomAbility(ability: AbilityScoreKey) {
    onChange({ spellcasting_ability: ability, spellcasting_class: 'Custom' })
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          className="input text-xs py-1.5 w-40"
          value={abilityKey ? (isCustom ? 'custom' : selectedClass) : ''}
          onChange={(e) => handleClassSelect(e.target.value)}
        >
          <option value="">No spellcasting</option>
          {SPELLCASTING_CLASS_OPTIONS.map((o) => (
            <option key={o.label} value={o.label}>{o.label}</option>
          ))}
          <option value="custom">Custom…</option>
        </select>
        {isCustom && (
          <select
            className="input text-xs py-1.5 w-36"
            value={abilityKey ?? 'int_score'}
            onChange={(e) => handleCustomAbility(e.target.value as AbilityScoreKey)}
          >
            {CUSTOM_ABILITY_OPTIONS.map((k) => (
              <option key={k} value={k}>{ABILITY_LABELS[k]}</option>
            ))}
          </select>
        )}
      </div>

      {abilityKey && (
        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-sm font-display font-semibold text-slate-100">{fmtMod(abilityMod_)}</p>
            <p className="text-[9px] uppercase tracking-widest text-slate-600">Modifier</p>
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-amber-300">{fmtMod(spellAttack)}</p>
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
