import { useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import type { ActionCategory, AttackKind, CombatAction, RechargeType } from '../types'

interface Props {
  initial?: CombatAction
  onSave: (data: Partial<CombatAction> & { name: string }) => void
  onCancel: () => void
  onDelete?: () => void
}

const CATEGORY_OPTIONS: { value: ActionCategory; label: string }[] = [
  { value: 'attack', label: 'Attack' },
  { value: 'action', label: 'Action' },
  { value: 'bonus_action', label: 'Bonus Action' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'other', label: 'Other' }
]

const ATTACK_KIND_OPTIONS: { value: AttackKind; label: string }[] = [
  { value: 'attack_roll', label: 'Attack roll (+N to hit)' },
  { value: 'save_dc', label: 'Save DC' },
  { value: 'none', label: 'No roll' }
]

const RECHARGE_OPTIONS: { value: RechargeType; label: string }[] = [
  { value: 'short_rest', label: 'Short Rest' },
  { value: 'long_rest', label: 'Long Rest' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'unlimited', label: 'Unlimited / At will' },
  { value: 'custom', label: 'Custom…' }
]

export function ActionForm({ initial, onSave, onCancel, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<ActionCategory>(initial?.category ?? 'attack')
  const [weaponType, setWeaponType] = useState(initial?.weapon_type ?? '')
  const [range, setRange] = useState(initial?.range ?? '')
  const [attackKind, setAttackKind] = useState<AttackKind>(initial?.attack_kind ?? 'attack_roll')
  const [hitDc, setHitDc] = useState(initial?.hit_dc_value != null ? String(initial.hit_dc_value) : '')
  const [damage, setDamage] = useState(initial?.damage ?? '')
  const [damageType, setDamageType] = useState(initial?.damage_type ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [maxUses, setMaxUses] = useState(initial?.max_uses != null ? String(initial.max_uses) : '')
  const [recharge, setRecharge] = useState<RechargeType>(initial?.recharge ?? 'long_rest')
  const [rechargeLabel, setRechargeLabel] = useState(initial?.recharge_label ?? '')

  function submit() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      category,
      weapon_type: weaponType,
      range,
      attack_kind: attackKind,
      hit_dc_value: hitDc === '' ? null : parseInt(hitDc) || 0,
      damage,
      damage_type: damageType,
      notes,
      description,
      max_uses: maxUses === '' ? null : Math.max(0, parseInt(maxUses) || 0),
      recharge,
      recharge_label: rechargeLabel
    })
  }

  return (
    <div className="bg-surface-overlay border border-border rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          className="input text-sm"
          placeholder="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <select
          className="input text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as ActionCategory)}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <input
        className="input text-xs"
        placeholder="Weapon / attack type (e.g. Ranged Weapon)"
        value={weaponType}
        onChange={(e) => setWeaponType(e.target.value)}
      />

      <div className="grid grid-cols-3 gap-2">
        <input
          className="input text-xs"
          placeholder="Range (e.g. 80/320 ft)"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        />
        <select
          className="input text-xs"
          value={attackKind}
          onChange={(e) => setAttackKind(e.target.value as AttackKind)}
        >
          {ATTACK_KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {attackKind !== 'none' ? (
          <input
            className="input text-xs"
            type="number"
            placeholder={attackKind === 'save_dc' ? 'DC' : '+ to hit'}
            value={hitDc}
            onChange={(e) => setHitDc(e.target.value)}
          />
        ) : (
          <div />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          className="input text-xs"
          placeholder="Damage (e.g. 1d8+1)"
          value={damage}
          onChange={(e) => setDamage(e.target.value)}
        />
        <input
          className="input text-xs"
          placeholder="Damage type (e.g. Piercing)"
          value={damageType}
          onChange={(e) => setDamageType(e.target.value)}
        />
      </div>

      <input
        className="input text-xs"
        placeholder="Notes (weapon properties, etc.)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <textarea
        className="input resize-none text-xs"
        rows={3}
        placeholder="In-depth effects / description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Max uses (blank = at will)</label>
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
