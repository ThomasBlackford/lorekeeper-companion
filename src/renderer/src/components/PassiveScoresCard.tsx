import type { Character, SkillId } from '../types'
import { SKILLS, skillModifier } from '../lib/dnd'

// The three passive scores a DM actually asks for mid-session — kept
// visible in the sidebar at all times instead of buried in the Skills tab,
// same reasoning as HP/AC always being on screen.
const PASSIVE_SKILLS: SkillId[] = ['perception', 'investigation', 'insight']

export function PassiveScoresCard({ character }: { character: Character }) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-4">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-3">Passive Scores</h2>
      <div className="grid grid-cols-3 gap-2">
        {PASSIVE_SKILLS.map((key) => {
          const skill = SKILLS.find((s) => s.key === key)!
          const level = character.skills[key] ?? 'none'
          const value = 10 + skillModifier(character, skill, level)
          return (
            <div
              key={key}
              className="flex flex-col items-center gap-1 bg-surface-overlay border border-border rounded-lg py-2.5"
            >
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-medium text-center leading-tight px-0.5">
                {skill.label}
              </span>
              <span className="text-lg font-display font-semibold text-slate-100">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
