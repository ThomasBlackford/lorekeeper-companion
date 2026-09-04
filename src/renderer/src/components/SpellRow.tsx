import { useState } from 'react'
import { Info, Pencil, Repeat, Sparkles } from 'lucide-react'
import type { Spell } from '../types'
import { DetailCard } from './DetailCard'

function levelLabel(level: number): string {
  if (level === 0) return 'Cantrip'
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th'
  return `${level}${suffix} Level`
}

interface Props {
  spell: Spell
  isConcentrating: boolean
  onTogglePrepared: () => void
  onToggleConcentration: () => void
  onEdit: () => void
}

export function SpellRow({ spell, isConcentrating, onTogglePrepared, onToggleConcentration, onEdit }: Props) {
  const hasDamage = spell.damage.trim().length > 0
  const [showCard, setShowCard] = useState(false)

  const badges = [
    spell.ritual && 'Ritual',
    spell.concentration && 'Concentration',
    spell.prepared && 'Prepared',
  ].filter(Boolean) as string[]

  return (
    <div className="rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors row-interactive">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <span className="w-6 h-6 flex-shrink-0 rounded-full bg-surface-overlay flex items-center justify-center text-[10px] font-bold text-slate-400">
          {spell.level === 0 ? 'C' : spell.level}
        </span>

        <button
          onClick={() => setShowCard(true)}
          title="Click to see the full entry"
          className="flex-1 min-w-0 text-left flex items-center gap-1.5"
        >
          <Info size={11} className="text-slate-600 flex-shrink-0" />
          <span className="min-w-0">
            <span className="text-sm text-slate-200 truncate block">{spell.name}</span>
            {hasDamage && (
              <span className="text-[10px] text-amber-500/70 truncate block">
                {spell.damage}{spell.damage_type && ` ${spell.damage_type}`}
              </span>
            )}
          </span>
        </button>

        {spell.concentration && (
          <button
            onClick={onToggleConcentration}
            title={isConcentrating ? 'Concentrating on this — click to drop' : 'Mark as your active concentration'}
            className={`flex-shrink-0 transition-colors ${isConcentrating ? 'text-purple-300' : 'text-purple-400/40 hover:text-purple-400'}`}
          >
            <Sparkles size={12} fill={isConcentrating ? 'currentColor' : 'none'} />
          </button>
        )}
        {spell.ritual && (
          <span title="Ritual" className="flex-shrink-0">
            <Repeat size={12} className="text-sky-400" />
          </span>
        )}

        <label className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0 cursor-pointer">
          <input type="checkbox" checked={spell.prepared} onChange={onTogglePrepared} /> Prep
        </label>

        <button onClick={onEdit} title="Edit" className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
          <Pencil size={12} />
        </button>
      </div>

      {showCard && (
        <DetailCard
          onClose={() => setShowCard(false)}
          title={spell.name}
          categoryLabel={[levelLabel(spell.level), spell.school].filter(Boolean).join(' — ')}
          badges={badges}
          stats={[
            { label: 'Casting Time', value: spell.casting_time },
            { label: 'Range', value: spell.range },
            { label: 'Duration', value: spell.duration },
            { label: 'Damage', value: [spell.damage, spell.damage_type].filter(Boolean).join(' ') },
          ]}
          description={spell.description}
        />
      )}
    </div>
  )
}
