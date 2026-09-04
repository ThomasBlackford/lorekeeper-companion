import { useState } from 'react'
import { Info, Pencil } from 'lucide-react'
import type { Ability } from '../types'
import { DetailCard } from './DetailCard'

const RECHARGE_LABEL: Record<string, string> = {
  short_rest: 'Short Rest',
  long_rest: 'Long Rest',
  dawn: 'Dawn',
  unlimited: 'Unlimited'
}

const CATEGORY_LABEL: Record<string, string> = {
  class_feature: 'Class Feature',
  species_trait: 'Species Trait',
  feat: 'Feat',
  other: 'Other'
}

interface Props {
  ability: Ability
  onUse: () => void
  onRestore: () => void
  onEdit: () => void
}

export function AbilityRow({ ability, onUse, onRestore, onEdit }: Props) {
  const label = ability.recharge === 'custom'
    ? ability.recharge_label || 'Custom'
    : RECHARGE_LABEL[ability.recharge]
  const hasUses = ability.max_uses != null
  const [showCard, setShowCard] = useState(false)

  return (
    <div className="rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors row-interactive">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button
          onClick={() => setShowCard(true)}
          title="Click to see the full entry"
          className="flex-1 min-w-0 text-left flex items-center gap-1.5"
        >
          <Info size={12} className="text-slate-600 flex-shrink-0" />
          <span className="min-w-0">
            <p className="text-sm text-slate-200 truncate">{ability.name}</p>
            <p className="text-[11px] text-slate-600">{CATEGORY_LABEL[ability.category]} · {label}</p>
          </span>
        </button>

        {hasUses && (
          <div className="flex items-center gap-1 text-xs text-slate-300 flex-shrink-0">
            <button
              onClick={onUse}
              disabled={ability.current_uses === 0}
              className="w-6 h-6 rounded bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-30"
            >
              −
            </button>
            <span className="w-8 text-center">{ability.current_uses}/{ability.max_uses}</span>
            <button
              onClick={onRestore}
              disabled={ability.current_uses === ability.max_uses}
              className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
            >
              +
            </button>
          </div>
        )}

        <button onClick={onEdit} title="Edit" className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
          <Pencil size={13} />
        </button>
      </div>

      {showCard && (
        <DetailCard
          onClose={() => setShowCard(false)}
          title={ability.name}
          categoryLabel={CATEGORY_LABEL[ability.category]}
          description={ability.description}
          usesLabel={hasUses ? `${ability.current_uses}/${ability.max_uses} uses — recharges on ${label}` : undefined}
        />
      )}
    </div>
  )
}
