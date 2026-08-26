import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Resource } from '../types'
import { v4 as uuidv4 } from 'uuid'

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']

export function ResourceTracker({
  resources,
  onChange
}: {
  resources: Resource[]
  onChange: (resources: Resource[]) => void
}) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newMax, setNewMax] = useState('20')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  function updateResource(id: string, patch: Partial<Resource>) {
    onChange(resources.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeResource(id: string) {
    onChange(resources.filter((r) => r.id !== id))
  }

  function addResource() {
    if (!newName.trim()) return
    const max = parseInt(newMax) || 20
    onChange([
      ...resources,
      { id: uuidv4(), name: newName.trim(), current: max, max, color: newColor }
    ])
    setNewName('')
    setNewMax('20')
    setAdding(false)
  }

  return (
    <div className="space-y-2.5">
      {resources.map((r) => (
        <div key={r.id} className="group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-medium">{r.name}</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={r.current}
                  onChange={(e) => updateResource(r.id, { current: Math.min(r.max, Math.max(0, parseInt(e.target.value) || 0)) })}
                  className="w-10 text-center bg-surface-overlay border border-border rounded text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 py-0.5"
                  min={0}
                  max={r.max}
                />
                <span className="text-slate-600 text-xs">/</span>
                <input
                  type="number"
                  value={r.max}
                  onChange={(e) => updateResource(r.id, { max: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-10 text-center bg-surface-overlay border border-border rounded text-xs text-slate-400 focus:outline-none focus:border-amber-500/60 py-0.5"
                  min={1}
                />
              </div>
              <button
                onClick={() => removeResource(r.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden bg-surface-overlay">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{
                width: `${r.max > 0 ? Math.min(100, (r.current / r.max) * 100) : 0}%`,
                backgroundColor: r.color
              }}
            />
          </div>
        </div>
      ))}

      {adding ? (
        <div className="p-2.5 bg-surface-overlay rounded-lg border border-border space-y-2">
          <input
            className="input text-xs py-1.5"
            placeholder="Resource name (e.g. Rage, Ki Points)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') addResource(); if (e.key === 'Escape') setAdding(false) }}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-8">Max</label>
            <input
              type="number"
              className="input text-xs py-1.5 w-20"
              value={newMax}
              onChange={(e) => setNewMax(e.target.value)}
              min={1}
            />
            <div className="flex gap-1 ml-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addResource} className="btn-primary py-1 text-xs">Add</button>
            <button onClick={() => setAdding(false)} className="btn-ghost py-1 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
        >
          <Plus size={12} /> Add resource
        </button>
      )}
    </div>
  )
}
