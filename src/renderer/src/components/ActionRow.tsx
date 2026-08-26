import { Pencil, Trash2 } from 'lucide-react'
import type { CombatAction } from '../types'

const CATEGORY_LABEL: Record<string, string> = {
  attack: 'Attack',
  action: 'Action',
  bonus_action: 'Bonus Action',
  reaction: 'Reaction',
  other: 'Other'
}

function formatHitDc(action: CombatAction): string {
  if (action.attack_kind === 'attack_roll') {
    return action.hit_dc_value != null ? `+${action.hit_dc_value}` : '—'
  }
  if (action.attack_kind === 'save_dc') {
    return action.hit_dc_value != null ? `DC ${action.hit_dc_value}` : '—'
  }
  return '—'
}

interface Props {
  action: CombatAction
  onEdit: () => void
  onDelete: () => void
  onUse: () => void
  onRestore: () => void
}

export function ActionRow({ action, onEdit, onDelete, onUse, onRestore }: Props) {
  const hasUses = action.max_uses != null

  return (
    <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors text-xs">
      <div className="w-32 flex-shrink-0 min-w-0">
        <p className="text-slate-200 font-medium truncate">{action.name}</p>
        {action.weapon_type && <p className="text-[10px] text-slate-600 truncate">{action.weapon_type}</p>}
      </div>
      <span className="w-20 flex-shrink-0 text-slate-400 truncate">{action.range || '—'}</span>
      <span className="w-12 flex-shrink-0 text-amber-300 font-medium">{formatHitDc(action)}</span>
      <span className="w-28 flex-shrink-0 text-slate-300 truncate">
        {action.damage || '—'}{action.damage_type && ` ${action.damage_type}`}
      </span>
      <span className="flex-1 min-w-0 text-slate-500 truncate">{action.notes}</span>
      <span className="w-20 flex-shrink-0 text-[10px] text-slate-600 uppercase tracking-wide">
        {CATEGORY_LABEL[action.category]}
      </span>

      {hasUses && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onUse}
            disabled={action.current_uses === 0}
            className="w-5 h-5 rounded bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-30"
          >
            −
          </button>
          <span className="w-8 text-center text-slate-300">{action.current_uses}/{action.max_uses}</span>
          <button
            onClick={onRestore}
            disabled={action.current_uses === action.max_uses}
            className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
          >
            +
          </button>
        </div>
      )}

      <button onClick={onEdit} className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
        <Pencil size={12} />
      </button>
      <button onClick={onDelete} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
        <Trash2 size={12} />
      </button>
    </div>
  )
}
