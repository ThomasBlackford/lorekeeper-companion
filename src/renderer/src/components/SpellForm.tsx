import { useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import type { Spell } from '../types'

interface Props {
  initial?: Spell
  onSave: (data: Partial<Spell> & { name: string }) => void
  onCancel: () => void
  onDelete?: () => void
}

const LEVEL_OPTIONS = [
  { value: 0, label: 'Cantrip' },
  ...Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: `Level ${i + 1}` }))
]

export function SpellForm({ initial, onSave, onCancel, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [level, setLevel] = useState(initial?.level ?? 0)
  const [school, setSchool] = useState(initial?.school ?? '')
  const [castingTime, setCastingTime] = useState(initial?.casting_time ?? '')
  const [range, setRange] = useState(initial?.range ?? '')
  const [duration, setDuration] = useState(initial?.duration ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [ritual, setRitual] = useState(initial?.ritual ?? false)
  const [concentration, setConcentration] = useState(initial?.concentration ?? false)
  const [prepared, setPrepared] = useState(initial?.prepared ?? false)

  function submit() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      level,
      school,
      casting_time: castingTime,
      range,
      duration,
      description,
      ritual,
      concentration,
      prepared
    })
  }

  return (
    <div className="bg-surface-overlay border border-border rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          className="input text-sm"
          placeholder="Spell name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <select
          className="input text-sm"
          value={level}
          onChange={(e) => setLevel(parseInt(e.target.value))}
        >
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input className="input text-xs" placeholder="School" value={school} onChange={(e) => setSchool(e.target.value)} />
        <input className="input text-xs" placeholder="Casting time" value={castingTime} onChange={(e) => setCastingTime(e.target.value)} />
        <input className="input text-xs" placeholder="Range" value={range} onChange={(e) => setRange(e.target.value)} />
      </div>

      <input className="input text-xs" placeholder="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} />

      <textarea
        className="input resize-none text-xs"
        rows={2}
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={ritual} onChange={(e) => setRitual(e.target.checked)} /> Ritual
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={concentration} onChange={(e) => setConcentration(e.target.checked)} /> Concentration
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={prepared} onChange={(e) => setPrepared(e.target.checked)} /> Prepared
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onDelete && (
          <button onClick={onDelete} className="mr-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
            <Trash2 size={12} /> Delete
          </button>
        )}
        <button onClick={onCancel} className="btn-ghost text-xs py-1"><X size={12} /> Cancel</button>
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors disabled:opacity-40"
        >
          <Check size={12} /> Save
        </button>
      </div>
    </div>
  )
}
