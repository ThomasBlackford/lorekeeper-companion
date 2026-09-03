import type { Character } from '../types'
import { ARMOR_PROFICIENCY_OPTIONS, COMMON_LANGUAGES, WEAPON_PROFICIENCY_PRESETS } from '../lib/dnd'
import { TagInput } from './TagInput'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

export function ProficienciesPanel({ character, onUpdate }: Props) {
  async function update(field: 'armor_proficiencies' | 'weapon_proficiencies' | 'tool_proficiencies' | 'languages', values: string[]) {
    const c = await window.api.character.updateProficiencies({ [field]: values })
    onUpdate(c)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Proficiencies &amp; Languages</h3>

      <div>
        <label className="text-xs text-slate-500 block mb-1.5">Armor</label>
        <TagInput
          values={character.armor_proficiencies}
          presets={ARMOR_PROFICIENCY_OPTIONS}
          onChange={(v) => update('armor_proficiencies', v)}
          placeholder="Add armor type…"
        />
      </div>

      <div>
        <label className="text-xs text-slate-500 block mb-1.5">Weapons</label>
        <TagInput
          values={character.weapon_proficiencies}
          presets={WEAPON_PROFICIENCY_PRESETS}
          onChange={(v) => update('weapon_proficiencies', v)}
          placeholder="Add specific weapon (e.g. Rapier)…"
        />
      </div>

      <div>
        <label className="text-xs text-slate-500 block mb-1.5">Tools</label>
        <TagInput
          values={character.tool_proficiencies}
          onChange={(v) => update('tool_proficiencies', v)}
          placeholder="Add tool (e.g. Thieves' Tools)…"
        />
      </div>

      <div>
        <label className="text-xs text-slate-500 block mb-1.5">Languages</label>
        <TagInput
          values={character.languages}
          presets={COMMON_LANGUAGES}
          onChange={(v) => update('languages', v)}
          placeholder="Add language…"
        />
      </div>
    </div>
  )
}
