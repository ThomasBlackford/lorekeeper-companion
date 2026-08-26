import { useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import type { Ability, AbilityCategory, RechargeType } from '../types'

interface Props {
  initial?: Ability
  onSave: (data: Partial<Ability> & { name: string }) => void
  onCancel: () => void
  onDelete?: () => void
}

const CATEGORY_OPTIONS: { value: AbilityCategory; label: string }[] = [
  { value: 'class_feature', label: 'Class Feature' },
  { value: 'species_trait', label: 'Species Trait' },
  { value: 'feat', label: 'Feat' },
  { value: 'other', label: 'Other' }
]

const RECHARGE_OPTIONS: { value: RechargeType; label: string }[] = [
  { value: 'short_rest', label: 'Short Rest' },
  { value: 'long_rest', label: 'Long Rest' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'unlimited', label: 'Unlimited / Passive' },
  { value: 'custom', label: 'Custom…' }
]

export function AbilityForm({ initial, onSave, onCancel, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<AbilityCategory>(initial?.category ?? 'class_feature')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [maxUses, setMaxUses] = useState(initial?.max_uses != null ? String(initial.max_uses) : '')
  const [recharge, setRecharge] = useState<RechargeType>(initial?.recharge ?? 'long_rest')
  const [rechargeLabel, setRechargeLabel] = useState(initial?.recharge_label ?? '')

  function submit() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      category,
      description,
      max_uses: maxUses === '' ? null : Math.max(0, parseInt(maxUses) || 0),
      recharge,
      recharge_label: rechargeLabel
    })
  }

  return (
    <div className="bg-surface-overlay border border-border rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input className="input text-sm" placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <select className="input text-sm" value={category} onChange={(e) => setCategory(e.target.value as AbilityCategory)}>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <textarea
        className="input resize-none text-xs"
        rows={2}
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Max uses (blank = passive)</label>
          <input
            className="input text-sm"
            type="number"
            min={0}
            placeholder="—"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Recharges on</label>
          <select className="input text-sm" value={recharge} onChange={(e) => setRecharge(e.target.value as RechargeType)}>
            {RECHARGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {recharge === 'custom' && (
        <input
          className="input text-xs"
          placeholder="e.g. Recharges on a roll of 5-6"
          value={rechargeLabel}
          onChange={(e) => setRechargeLabel(e.target.value)}
        />
      )}

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
