import { useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import type { InventoryCategory, InventoryItem } from '../types'

interface Props {
  initial?: InventoryItem
  onSave: (data: Partial<InventoryItem> & { name: string }) => void
  onCancel: () => void
  onDelete?: () => void
}

const CATEGORY_OPTIONS: { value: InventoryCategory; label: string }[] = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'backpack', label: 'Backpack' },
  { value: 'attunement', label: 'Attunement' },
  { value: 'other', label: 'Other Possessions' }
]

export function InventoryItemForm({ initial, onSave, onCancel, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<InventoryCategory>(initial?.category ?? 'equipment')
  const [weight, setWeight] = useState(initial?.weight != null ? String(initial.weight) : '')
  const [quantity, setQuantity] = useState(initial?.quantity != null ? String(initial.quantity) : '1')
  const [cost, setCost] = useState(initial?.cost != null ? String(initial.cost) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [equipped, setEquipped] = useState(initial?.equipped ?? false)

  function submit() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      category,
      weight: parseFloat(weight) || 0,
      quantity: Math.max(1, parseInt(quantity) || 1),
      cost: parseFloat(cost) || 0,
      notes,
      equipped
    })
  }

  return (
    <div className="bg-surface-overlay border border-border rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          className="input text-sm"
          placeholder="Item name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <select
          className="input text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as InventoryCategory)}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Weight (lb, each)</label>
          <input className="input text-sm" type="number" min={0} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Qty</label>
          <input className="input text-sm" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Cost (gp)</label>
          <input className="input text-sm" type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
      </div>

      <input
        className="input text-xs"
        placeholder="Notes (properties, AC, etc.)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
        <input type="checkbox" checked={equipped} onChange={(e) => setEquipped(e.target.checked)} /> Equipped / worn
      </label>

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
