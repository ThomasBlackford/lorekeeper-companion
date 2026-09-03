import { useState } from 'react'
import { Dices } from 'lucide-react'
import type { AbilityScoreKey, Character, SkillId, SkillProficiency } from '../types'
import {
  ABILITY_ORDER, ABILITY_SHORT, EXHAUSTION_EFFECTS, SKILLS,
  abilityMod, fmtMod, proficiencyBonusForLevel, rollD20, saveModifier, skillModifier
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

// Shows the roll total in place of the static modifier for a couple of
// seconds after the dice is clicked, then reverts — an ephemeral flash
// rather than persisted state, since a skill/save check isn't something the
// sheet needs to remember.
function RollableValue({ rollKey, modifier, rolls, onRoll }: {
  rollKey: string
  modifier: number
  rolls: Record<string, number>
  onRoll: (key: string, mod: number) => void
}) {
  const rolled = rolls[rollKey]
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); onRoll(rollKey, modifier) }}
        title="Roll d20 + modifier"
        className="text-slate-600 hover:text-amber-300 transition-colors flex-shrink-0"
      >
        <Dices size={12} />
      </button>
      <span className={`text-sm font-display font-semibold w-10 text-right flex-shrink-0 ${rolled != null ? 'text-amber-300' : 'text-slate-100'}`}>
        {rolled != null ? rolled : fmtMod(modifier)}
      </span>
    </>
  )
}

export function SkillsSection({ character, onUpdate }: Props) {
  const [rolls, setRolls] = useState<Record<string, number>>({})

  function handleRoll(key: string, modifier: number) {
    const total = rollD20() + modifier
    setRolls((prev) => ({ ...prev, [key]: total }))
    setTimeout(() => setRolls((prev) => { const { [key]: _drop, ...rest } = prev; return rest }), 2500)
  }

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

  async function setExhaustion(v: number) {
    const c = await window.api.character.save({ exhaustion_level: Math.max(0, Math.min(6, v)) })
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Exhaustion</span>
          <Stepper value={character.exhaustion_level} onChange={setExhaustion} min={0} max={6} format="plain" />
          <span className={`text-[11px] ${character.exhaustion_level > 0 ? 'text-red-400/80' : 'text-slate-600'}`}>
            {EXHAUSTION_EFFECTS[character.exhaustion_level]}
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
              <div
                key={ability}
                className={`flex items-center justify-between gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border text-xs transition-colors ${
                  proficient
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-surface-overlay border-border text-slate-400 hover:border-slate-600'
                }`}
              >
                <button
                  onClick={() => toggleSave(ability)}
                  title="Click to toggle proficiency"
                  className="flex items-center gap-1.5 flex-1 py-0.5"
                >
                  <ProfMark level={proficient ? 'proficient' : 'none'} />
                  {ABILITY_SHORT[ability]}
                </button>
                <RollableValue rollKey={`save:${ability}`} modifier={value} rolls={rolls} onRoll={handleRoll} />
              </div>
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
              <div
                key={skill.key}
                className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <button
                  onClick={() => setSkill(skill.key, cycleProficiency(level))}
                  title="Click to cycle: not proficient → proficient → expertise"
                  className="flex items-center gap-2.5 flex-1 min-w-0 py-0.5 text-left"
                >
                  <ProfMark level={level} />
                  <span className="text-sm text-slate-200">{skill.label}</span>
                </button>
                <span className="text-[10px] uppercase text-slate-600 w-8 flex-shrink-0">{ABILITY_SHORT[skill.ability]}</span>
                <RollableValue rollKey={`skill:${skill.key}`} modifier={value} rolls={rolls} onRoll={handleRoll} />
              </div>
            )
          })}
        </div>
      </div>

      <ProficienciesPanel character={character} onUpdate={onUpdate} />
    </div>
  )
}
