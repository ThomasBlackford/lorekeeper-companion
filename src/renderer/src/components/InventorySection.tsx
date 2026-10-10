import { useState } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import type { Character, InventoryCategory, InventoryItem } from '../types'
import { NumberField } from './NumberField'
import { useConfirm } from '../hooks/useConfirm'
import { LibraryModal } from './LibraryModal'
import { SRD_GEAR } from '../data/srdGear'
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

const COINS = [
  { key: 'pp', label: 'Platinum', color: 'text-slate-200' },
  { key: 'gold', label: 'Gold', color: 'text-amber-300' },
  { key: 'ep', label: 'Electrum', color: 'text-sky-200' },
  { key: 'sp', label: 'Silver', color: 'text-slate-300' },
  { key: 'cp', label: 'Copper', color: 'text-orange-300' }
] as const

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
  const { ask, dialog } = useConfirm()
  const [library, setLibrary] = useState(false)

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

  function requestRemove(x: { id: string; name: string }) {
    ask({
      title: `Delete ${x.name}?`,
      message: "This can't be undone.",
      confirmLabel: 'Delete',
      danger: true,
      onYes: () => handleRemove(x.id)
    })
  }

  async function handleCoinChange(key: (typeof COINS)[number]['key'], value: number) {
    const c = await window.api.character.save({ [key]: value })
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
      <div className="flex justify-end items-center gap-4 mb-3">
        <button
          onClick={() => setLibrary(true)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <BookOpen size={13} /> From library
        </button>
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
        <div className="flex items-end gap-1.5">
          {COINS.map(({ key, label, color }) => (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <NumberField
                className={`w-14 text-center text-sm bg-surface-overlay border border-border px-1 py-1 focus:outline-none focus:border-amber-500/60 ${color}`}
                value={character[key]}
                min={0}
                onCommit={(v) => handleCoinChange(key, v)}
                title={label}
              />
              <span className="text-[9px] uppercase tracking-widest text-slate-600">{key === 'gold' ? 'gp' : key}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-1.5 rounded-full overflow-hidden bg-surface-overlay mb-3">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${barColor}`}
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

      <div>
        <div className="space-y-1.5">
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
                  onDelete={() => requestRemove(i)}
                />
              ) : (
                <InventoryItemRow
                  key={i.id}
                  item={i}
                  onToggleEquipped={() => handleUpdate(i.id, { equipped: !i.equipped })}
                  onEdit={() => setEditingId(i.id)}
                  onDelete={() => requestRemove(i)}
                />
              )
            )
          )}
        </div>
      </div>
      {library && (
        <LibraryModal
          title="Gear library"
          items={SRD_GEAR.map((g) => ({
            key: g.name,
            name: g.name,
            group: g.group,
            meta: [g.damage ? `${g.damage} ${g.damage_type ?? ''}`.trim() : null, g.notes, `${g.weight} lb`, `${g.cost} gp`].filter(Boolean).join(' · ')
          }))}
          groups={['Weapons', 'Armor', 'Gear']}
          alreadyHave={new Set(character.inventory.map((i) => i.name.toLowerCase()))}
          onClose={() => setLibrary(false)}
          onPick={async (key) => {
            const g = SRD_GEAR.find((x) => x.name === key)
            if (!g) return
            onUpdate(
              await window.api.inventory.add({
                name: g.name, category: g.category, weight: g.weight, quantity: 1, cost: g.cost,
                notes: g.notes, damage: g.damage ?? '', damage_type: g.damage_type ?? '', range: g.range ?? ''
              })
            )
          }}
        />
      )}
      {dialog}
    </div>
  )
}
