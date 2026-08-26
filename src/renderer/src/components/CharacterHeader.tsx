import { useState, useEffect } from 'react'
import type { Character } from '../types'

interface Props {
  character: Character
  onSave: (changes: Partial<Pick<Character, 'name' | 'race' | 'class' | 'level' | 'alignment'>>) => void
}

export function CharacterHeader({ character, onSave }: Props) {
  const [name, setName] = useState(character.name)
  const [race, setRace] = useState(character.race)
  const [charClass, setCharClass] = useState(character.class)
  const [level, setLevel] = useState(String(character.level))
  const [alignment, setAlignment] = useState(character.alignment)

  useEffect(() => setName(character.name), [character.name])
  useEffect(() => setRace(character.race), [character.race])
  useEffect(() => setCharClass(character.class), [character.class])
  useEffect(() => setLevel(String(character.level)), [character.level])
  useEffect(() => setAlignment(character.alignment), [character.alignment])

  function commitLevel() {
    const val = parseInt(level)
    onSave({ level: isNaN(val) ? 1 : Math.max(1, val) })
  }

  return (
    <div className="text-center pt-2 space-y-2">
      <input
        className="w-full text-center bg-transparent font-display text-2xl font-semibold text-white
                   focus:outline-none focus:bg-surface-overlay rounded-lg py-1 transition-colors"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onSave({ name })}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder="Character Name"
      />

      <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
        <input
          className="text-center bg-transparent text-slate-300 focus:outline-none focus:bg-surface-overlay rounded-lg py-1 px-2 w-28 transition-colors"
          value={race}
          onChange={(e) => setRace(e.target.value)}
          onBlur={() => onSave({ race })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="Race"
        />
        <span className="text-slate-700">·</span>
        <input
          className="text-center bg-transparent text-slate-300 focus:outline-none focus:bg-surface-overlay rounded-lg py-1 px-2 w-28 transition-colors"
          value={charClass}
          onChange={(e) => setCharClass(e.target.value)}
          onBlur={() => onSave({ class: charClass })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="Class"
        />
        <span className="text-slate-700">·</span>
        <div className="flex items-center gap-1 text-slate-300">
          <span className="text-slate-500 text-xs">Lv</span>
          <input
            className="w-8 text-center bg-transparent focus:outline-none focus:bg-surface-overlay rounded-lg py-1 transition-colors"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            onBlur={commitLevel}
            onKeyDown={(e) => e.key === 'Enter' && commitLevel()}
          />
        </div>
      </div>

      <input
        className="text-center bg-transparent text-xs text-amber-400/70 tracking-wide
                   focus:outline-none focus:bg-surface-overlay rounded-lg py-1 px-2 transition-colors"
        value={alignment}
        onChange={(e) => setAlignment(e.target.value)}
        onBlur={() => onSave({ alignment })}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder="Alignment (e.g. Chaotic Good)"
      />
    </div>
  )
}
