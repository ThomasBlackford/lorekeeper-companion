import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { Defense, DefenseType } from '../types'

const TYPE_STYLE: Record<DefenseType, string> = {
  resistance: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  immunity: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
  vulnerability: 'bg-red-500/15 border-red-500/30 text-red-300'
}

const TYPE_LABEL: Record<DefenseType, string> = {
  resistance: 'Resist',
  immunity: 'Immune',
  vulnerability: 'Vuln'
}

interface Props {
  defenses: Defense[]
  onChange: (defenses: Defense[]) => void
}

export function DefensesList({ defenses, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState<DefenseType>('resistance')
  const [label, setLabel] = useState('')

  function add() {
    if (!label.trim()) return
    onChange([...defenses, { id: uuidv4(), type, label: label.trim() }])
    setLabel('')
    setAdding(false)
  }

  function remove(id: string) {
    onChange(defenses.filter((d) => d.id !== id))
  }

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-4">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-3">Defenses</h2>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {defenses.map((d) => (
          <span
            key={d.id}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${TYPE_STYLE[d.type]}`}
          >
            <span className="font-semibold">{TYPE_LABEL[d.type]}</span> {d.label}
            <button onClick={() => remove(d.id)} className="opacity-60 hover:opacity-100 leading-none">
              <X size={10} />
            </button>
          </span>
        ))}
        {defenses.length === 0 && !adding && <span className="text-xs text-slate-600">None</span>}
      </div>

      {adding ? (
        <div className="flex items-center gap-1.5">
          <select
            className="input text-xs py-1 w-28"
            value={type}
            onChange={(e) => setType(e.target.value as DefenseType)}
          >
            <option value="resistance">Resistance</option>
            <option value="immunity">Immunity</option>
            <option value="vulnerability">Vulnerability</option>
          </select>
          <input
            className="input text-xs py-1 flex-1"
            placeholder="e.g. Fire, Poison"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false) }}
            autoFocus
          />
          <button onClick={add} className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0">
            Add
          </button>
          <button onClick={() => setAdding(false)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Plus size={12} /> Add defense
        </button>
      )}
    </div>
  )
}
