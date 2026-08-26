import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Character, InventoryCategory, InventoryItem } from '../types'
import { InventoryItemRow } from './InventoryItemRow'
import { InventoryItemForm } from './InventoryItemForm'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

const FILTER_TABS: { value: InventoryCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'backpack', label: 'Backpack' },
  { value: 'attunement', label: 'Attunement' },
  { value: 'other', label: 'Other' }
]

// Standard 5e carrying-capacity tiers, all derived from the raw STR score:
// unencumbered up to 5×STR, encumbered above that, heavily encumbered above
// 10×STR, and 15×STR is the hard carry limit.
function encumbranceStatus(carried: number, strScore: number): { label: string; color: string } {
  if (carried > strScore * 15) return { label: 'Over Capacity', color: 'text-red-400' }
  if (carried > strScore * 10) return { label: 'Heavily Encumbered', color: 'text-red-400' }
  if (carried > strScore * 5) return { label: 'Encumbered', color: 'text-amber-400' }
  return { label: 'Unencumbered', color: 'text-emerald-400' }
}

export function InventorySection({ character, onUpdate }: Props) {
  const [filter, setFilter] = useState<InventoryCategory | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleAdd(data: Partial<InventoryItem> & { name: string }) {
    const c = await window.api.inventory.add(data)
    onUpdate(c)
    setAdding(false)
  }

  async function handleUpdate(id: string, changes: Partial<InventoryItem>) {
    const c = await window.api.inventory.update(id, changes)
    onUpdate(c)
  }

  async function handleRemove(id: string) {
    const c = await window.api.inventory.remove(id)
    onUpdate(c)
    setEditingId(null)
  }

  async function handleGoldChange(value: number) {
    const c = await window.api.character.save({ gold: value })
    onUpdate(c)
  }

  const totalWeight = character.inventory.reduce((sum, i) => sum + i.weight * i.quantity, 0)
  const capacity = character.str_score * 15
  const status = encumbranceStatus(totalWeight, character.str_score)
  const filtered = character.inventory.filter((i) => filter === 'all' || i.category === filter)

  const barColor =
    totalWeight > capacity ? 'bg-red-500'
      : totalWeight > character.str_score * 10 ? 'bg-red-400'
        : totalWeight > character.str_score * 5 ? 'bg-amber-400'
          : 'bg-emerald-500'

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Plus size={13} /> Add Item
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div>
          <p className="text-xs text-slate-400">
            <span className="text-slate-200 font-medium">{totalWeight.toFixed(1)}</span> / {capacity} lb carried
          </p>
          <p className={`text-[11px] font-medium ${status.color}`}>{status.label}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500">Gold</label>
          <input
            type="number"
            className="w-20 text-center text-sm bg-surface-overlay border border-border rounded-lg px-2 py-1 text-amber-300 focus:outline-none focus:border-amber-500/60"
            value={character.gold}
            onChange={(e) => handleGoldChange(Math.max(0, parseInt(e.target.value) || 0))}
          />
          <span className="text-xs text-slate-600">gp</span>
        </div>
      </div>

      <div className="relative h-1.5 rounded-full overflow-hidden bg-surface-overlay mb-3">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${capacity > 0 ? Math.min(100, (totalWeight / capacity) * 100) : 0}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
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

      {adding && (
        <div className="mb-3">
          <InventoryItemForm onSave={handleAdd} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="space-y-1.5 min-w-[420px]">
          {filtered.length === 0 && !adding ? (
            <p className="text-xs text-slate-600 text-center py-4">No items yet.</p>
          ) : (
            filtered.map((i) =>
              editingId === i.id ? (
                <InventoryItemForm
                  key={i.id}
                  initial={i}
                  onSave={(changes) => handleUpdate(i.id, changes).then(() => setEditingId(null))}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleRemove(i.id)}
                />
              ) : (
                <InventoryItemRow
                  key={i.id}
                  item={i}
                  onToggleEquipped={() => handleUpdate(i.id, { equipped: !i.equipped })}
                  onEdit={() => setEditingId(i.id)}
                  onDelete={() => handleRemove(i.id)}
                />
              )
            )
          )}
        </div>
      </div>
    </div>
  )
}
