import { Pencil, Trash2 } from 'lucide-react'
import type { InventoryItem } from '../types'

interface Props {
  item: InventoryItem
  onToggleEquipped: () => void
  onEdit: () => void
  onDelete: () => void
}

export function InventoryItemRow({ item, onToggleEquipped, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors text-xs">
      <input
        type="checkbox"
        checked={item.equipped}
        onChange={onToggleEquipped}
        title="Equipped"
        className="flex-shrink-0"
      />
      <button onClick={onEdit} className="flex-1 min-w-0 text-left">
        <p className="text-slate-200 font-medium truncate">{item.name}</p>
      </button>
      <span className="w-14 flex-shrink-0 text-slate-400 text-right">{item.weight} lb</span>
      <span className="w-10 flex-shrink-0 text-slate-400 text-right">×{item.quantity}</span>
      <span className="w-16 flex-shrink-0 text-slate-500 text-right">{item.cost} gp</span>
      <span className="flex-1 min-w-0 text-slate-500 truncate hidden sm:block">{item.notes}</span>
      <button onClick={onEdit} className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
        <Pencil size={12} />
      </button>
      <button onClick={onDelete} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
        <Trash2 size={12} />
      </button>
    </div>
  )
}
