import { useState } from 'react'
import { Info, Pencil, Trash2 } from 'lucide-react'
import type { CombatAction } from '../types'
import { DetailCard } from './DetailCard'
import { AttackRollButtons } from './AttackRollButtons'

const CATEGORY_LABEL: Record<string, string> = {
  attack: 'Attack',
  action: 'Action',
  bonus_action: 'Bonus Action',
  reaction: 'Reaction',
  other: 'Other'
}

const RECHARGE_LABEL: Record<string, string> = {
  short_rest: 'Short Rest', long_rest: 'Long Rest', dawn: 'Dawn', unlimited: 'Unlimited'
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
  const [showCard, setShowCard] = useState(false)

  return (
    <div className="rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors text-xs row-interactive">
      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap px-2.5 py-2">
        <button
          onClick={() => setShowCard(true)}
          title="Click to see the full entry"
          className="flex-1 basis-40 min-w-0 text-left flex items-center gap-1.5"
        >
          <Info size={11} className="text-slate-600 flex-shrink-0" />
          <span className="min-w-0">
            <p className="text-slate-200 font-medium truncate">{action.name}</p>
            <p className="text-[10px] text-slate-600 truncate">
              {[CATEGORY_LABEL[action.category], action.weapon_type].filter(Boolean).join(' · ')}
            </p>
          </span>
        </button>

        <div className="flex items-center gap-x-3 flex-wrap text-slate-400">
          {action.range && <span className="whitespace-nowrap">{action.range}</span>}
          {action.attack_kind !== 'none' && (
            <span className="text-amber-300 font-medium whitespace-nowrap">{formatHitDc(action)}</span>
          )}
          {action.damage && (
            <span className="text-slate-200 whitespace-nowrap">
              {action.damage}{action.damage_type && ` ${action.damage_type}`}
            </span>
          )}
        </div>

        <AttackRollButtons name={action.name} attackKind={action.attack_kind} hit={action.hit_dc_value} damage={action.damage} compact />

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

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onEdit} title="Edit" className="text-slate-600 hover:text-slate-300 transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} title="Delete" className="text-slate-600 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>

        {action.notes && <p className="basis-full text-[11px] text-slate-500 pl-[1.1rem] truncate">{action.notes}</p>}
      </div>

      {showCard && (
        <DetailCard
          onClose={() => setShowCard(false)}
          title={action.name}
          categoryLabel={[CATEGORY_LABEL[action.category], action.weapon_type].filter(Boolean).join(' · ')}
          stats={[
            { label: 'Range', value: action.range },
            { label: action.attack_kind === 'save_dc' ? 'Save DC' : 'To Hit', value: formatHitDc(action) },
            { label: 'Damage', value: [action.damage, action.damage_type].filter(Boolean).join(' ') },
          ]}
          notes={action.notes}
          description={action.description}
          footer={<AttackRollButtons name={action.name} attackKind={action.attack_kind} hit={action.hit_dc_value} damage={action.damage} />}
          usesLabel={
            hasUses
              ? `${action.current_uses}/${action.max_uses} uses — recharges on ${
                  action.recharge === 'custom' ? action.recharge_label || 'Custom' : RECHARGE_LABEL[action.recharge]
                }`
              : undefined
          }
        />
      )}
    </div>
  )
}
