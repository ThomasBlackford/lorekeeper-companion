import type { AbilityScoreKey, Character, SkillId, SkillProficiency } from '../types'
import {
  ABILITY_ORDER, ABILITY_SHORT, SKILLS,
  abilityMod, fmtMod, proficiencyBonusForLevel, saveModifier, skillModifier
} from '../lib/dnd'
import { Stepper } from './Stepper'
import { ProficienciesPanel } from './ProficienciesPanel'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

function cycleProficiency(p: SkillProficiency): SkillProficiency {
  return p === 'none' ? 'proficient' : p === 'proficient' ? 'expertise' : 'none'
}

function ProfMark({ level }: { level: SkillProficiency }) {
  if (level === 'expertise') return <span className="text-amber-300 text-[11px] leading-none tracking-[-1px]">●●</span>
  if (level === 'proficient') return <span className="text-amber-300 text-[11px] leading-none">●</span>
  return <span className="text-slate-700 text-[11px] leading-none">○</span>
}

export function SkillsSection({ character, onUpdate }: Props) {
  async function setSkill(key: SkillId, level: SkillProficiency) {
    const skills = { ...character.skills, [key]: level }
    const c = await window.api.character.updateSkills(skills)
    onUpdate(c)
  }

  async function toggleSave(ability: AbilityScoreKey) {
    const has = character.save_proficiencies.includes(ability)
    const next = has
      ? character.save_proficiencies.filter((a) => a !== ability)
      : [...character.save_proficiencies, ability]
    const c = await window.api.character.updateProficiencies({ save_proficiencies: next })
    onUpdate(c)
  }

  async function setInitiativeBonus(v: number) {
    const c = await window.api.character.save({ initiative_bonus: v })
    onUpdate(c)
  }

  async function autoProficiencyBonus() {
    const c = await window.api.character.save({ proficiency_bonus: proficiencyBonusForLevel(character.level) })
    onUpdate(c)
  }

  const dexMod = abilityMod(character.dex_score)
  const initTotal = dexMod + character.initiative_bonus
  const sinceAuto = proficiencyBonusForLevel(character.level)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Proficiency Bonus</span>
          <span className="text-sm font-display font-semibold text-amber-300">{fmtMod(character.proficiency_bonus ?? 0)}</span>
          <button
            onClick={autoProficiencyBonus}
            title={`Set from level (${fmtMod(sinceAuto)} at level ${character.level})`}
            className="text-[10px] text-slate-600 hover:text-amber-300 underline decoration-dotted transition-colors"
          >
            auto
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Initiative Bonus</span>
          <Stepper value={character.initiative_bonus} onChange={setInitiativeBonus} />
          <span className="text-[11px] text-slate-600">
            = {fmtMod(initTotal)} total (DEX {fmtMod(dexMod)} + bonus)
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">Saving Throws</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {ABILITY_ORDER.map((ability) => {
            const proficient = character.save_proficiencies.includes(ability)
            const value = saveModifier(character, ability, proficient)
            return (
              <button
                key={ability}
                onClick={() => toggleSave(ability)}
                title="Click to toggle proficiency"
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                  proficient
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-surface-overlay border-border text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ProfMark level={proficient ? 'proficient' : 'none'} />
                  {ABILITY_SHORT[ability]}
                </span>
                <span className="font-display font-semibold">{fmtMod(value)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">Skills</h3>
        <div className="space-y-0.5">
          {SKILLS.map((skill) => {
            const level = character.skills[skill.key] ?? 'none'
            const value = skillModifier(character, skill, level)
            return (
              <button
                key={skill.key}
                onClick={() => setSkill(skill.key, cycleProficiency(level))}
                title="Click to cycle: not proficient → proficient → expertise"
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <ProfMark level={level} />
                <span className="text-sm text-slate-200 flex-1">{skill.label}</span>
                <span className="text-[10px] uppercase text-slate-600 w-8">{ABILITY_SHORT[skill.ability]}</span>
                <span className="text-sm font-display font-semibold text-slate-100 w-8 text-right">{fmtMod(value)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ProficienciesPanel character={character} onUpdate={onUpdate} />
    </div>
  )
}
