import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { ActionCategory, Character, CombatAction } from '../types'
import { ActionRow } from './ActionRow'
import { ActionForm } from './ActionForm'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

const FILTER_TABS: { value: ActionCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'attack', label: 'Attack' },
  { value: 'action', label: 'Action' },
  { value: 'bonus_action', label: 'Bonus Action' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'other', label: 'Other' }
]

export function ActionsSection({ character, onUpdate }: Props) {
  const [filter, setFilter] = useState<ActionCategory | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleAdd(data: Partial<CombatAction> & { name: string }) {
    const c = await window.api.actions.add(data)
    onUpdate(c)
    setAdding(false)
  }

  async function handleUpdate(id: string, changes: Partial<CombatAction>) {
    const c = await window.api.actions.update(id, changes)
    onUpdate(c)
  }

  async function handleRemove(id: string) {
    const c = await window.api.actions.remove(id)
    onUpdate(c)
    setEditingId(null)
  }

  function handleUse(a: CombatAction, sign: 1 | -1) {
    if (a.current_uses == null || a.max_uses == null) return
    const next = Math.max(0, Math.min(a.max_uses, a.current_uses + sign))
    handleUpdate(a.id, { current_uses: next })
  }

  const filtered = character.actions.filter((a) => filter === 'all' || a.category === filter)

  return (
    <div>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <div className="flex flex-wrap gap-1">
          {FILTER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                filter === t.value
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0"
        >
          <Plus size={13} /> Add Action
        </button>
      </div>

      {adding && (
        <div className="mb-3">
          <ActionForm onSave={handleAdd} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="space-y-1.5 min-w-[560px]">
          {filtered.length === 0 && !adding ? (
            <p className="text-xs text-slate-600 text-center py-4">No actions yet.</p>
          ) : (
            filtered.map((a) =>
              editingId === a.id ? (
                <ActionForm
                  key={a.id}
                  initial={a}
                  onSave={(changes) => handleUpdate(a.id, changes).then(() => setEditingId(null))}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleRemove(a.id)}
                />
              ) : (
                <ActionRow
                  key={a.id}
                  action={a}
                  onEdit={() => setEditingId(a.id)}
                  onDelete={() => handleRemove(a.id)}
                  onUse={() => handleUse(a, -1)}
                  onRestore={() => handleUse(a, 1)}
                />
              )
            )
          )}
        </div>
      </div>
    </div>
  )
}
