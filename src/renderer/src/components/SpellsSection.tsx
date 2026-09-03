import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import type { AbilityScoreKey, Character, Spell } from '../types'
import { SpellcastingStats } from './SpellcastingStats'
import { SpellSlots } from './SpellSlots'
import { SpellRow } from './SpellRow'
import { SpellForm } from './SpellForm'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

function levelLabel(level: number): string {
  if (level === 0) return 'Cantrip'
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th'
  return `${level}${suffix}`
}

export function SpellsSection({ character, onUpdate }: Props) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleSpellcastingChange(changes: { spellcasting_ability: AbilityScoreKey | null; spellcasting_class: string }) {
    const c = await window.api.character.save(changes)
    onUpdate(c)
  }

  async function handleSlotChange(level: number, changes: { max?: number; current?: number }) {
    const c = await window.api.spellSlots.update(level, changes)
    onUpdate(c)
  }

  async function handleAdd(data: Partial<Spell> & { name: string }) {
    const c = await window.api.spells.add(data)
    onUpdate(c)
    setAdding(false)
  }

  async function handleUpdate(id: string, changes: Partial<Spell>) {
    const c = await window.api.spells.update(id, changes)
    onUpdate(c)
  }

  async function handleRemove(id: string) {
    const c = await window.api.spells.remove(id)
    onUpdate(c)
    setEditingId(null)
  }

  const levelsPresent = Array.from(new Set(character.spells.map((s) => s.level))).sort((a, b) => a - b)

  const filtered = character.spells.filter((s) => {
    if (levelFilter !== 'all' && s.level !== levelFilter) return false
    if (search.trim() && !s.name.toLowerCase().includes(search.trim().toLowerCase())) return false
    return true
  })

  const grouped = levelsPresent
    .filter((lvl) => levelFilter === 'all' || lvl === levelFilter)
    .map((lvl) => ({ level: lvl, spells: filtered.filter((s) => s.level === lvl) }))
    .filter((g) => g.spells.length > 0)

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Plus size={13} /> Add Spell
        </button>
      </div>

      <SpellcastingStats character={character} onChange={handleSpellcastingChange} />
      <SpellSlots slots={character.spellSlots} onChange={handleSlotChange} />

      <div className="relative mt-3">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          className="input text-xs pl-7 py-1.5"
          placeholder="Search spell names…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        <button
          onClick={() => setLevelFilter('all')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
            levelFilter === 'all'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'text-slate-500 hover:text-slate-300 border-transparent'
          }`}
        >
          All
        </button>
        {levelsPresent.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevelFilter(lvl)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              levelFilter === lvl
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >
            {levelLabel(lvl)}
          </button>
        ))}
      </div>

      {adding && (
        <div className="mt-3">
          <SpellForm onSave={handleAdd} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="mt-3 space-y-3">
        {grouped.length === 0 && !adding ? (
          <p className="text-xs text-slate-600 text-center py-4">No spells found.</p>
        ) : (
          grouped.map((g) => (
            <div key={g.level}>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-1.5">
                {g.level === 0 ? 'Cantrip' : `${levelLabel(g.level)} Level`}
              </p>
              <div className="space-y-1.5">
                {g.spells.map((s) =>
                  editingId === s.id ? (
                    <SpellForm
                      key={s.id}
                      initial={s}
                      onSave={(changes) => handleUpdate(s.id, changes).then(() => setEditingId(null))}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => handleRemove(s.id)}
                    />
                  ) : (
                    <SpellRow
                      key={s.id}
                      spell={s}
                      onTogglePrepared={() => handleUpdate(s.id, { prepared: !s.prepared })}
                      onEdit={() => setEditingId(s.id)}
                    />
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
