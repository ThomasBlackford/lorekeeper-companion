import { useState, useEffect } from 'react'
import type { Character } from '../types'

function VitalTile({
  label, value, onCommit, prefix, suffix
}: {
  label: string
  value: number | null
  onCommit: (v: number | null) => void
  prefix?: string
  suffix?: string
}) {
  const [text, setText] = useState(value != null ? String(value) : '')
  useEffect(() => setText(value != null ? String(value) : ''), [value])

  function commit() {
    const val = parseInt(text)
    onCommit(isNaN(val) ? null : val)
  }

  return (
    <div className="flex flex-col items-center gap-1 bg-surface-overlay border border-border rounded-lg py-2.5">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{label}</span>
      <div className="flex items-center gap-0.5 text-lg font-display font-semibold text-slate-100">
        {prefix && <span className="text-slate-500 text-sm">{prefix}</span>}
        <input
          className="w-12 text-center bg-transparent focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
        {suffix && <span className="text-slate-500 text-xs">{suffix}</span>}
      </div>
    </div>
  )
}

interface Props {
  character: Character
  onChange: (changes: Partial<Pick<Character, 'ac' | 'proficiency_bonus' | 'speed'>>) => void
}

export function VitalsRow({ character, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <VitalTile label="Armor Class" value={character.ac} onCommit={(v) => onChange({ ac: v })} />
      <VitalTile label="Proficiency" value={character.proficiency_bonus} onCommit={(v) => onChange({ proficiency_bonus: v })} prefix="+" />
      <VitalTile label="Speed" value={character.speed} onCommit={(v) => onChange({ speed: v })} suffix="ft" />
    </div>
  )
}
