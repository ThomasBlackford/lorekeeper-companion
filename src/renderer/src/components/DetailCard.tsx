import { X } from 'lucide-react'

export interface DetailStat {
  label: string
  value: string
}

interface Props {
  onClose: () => void
  title: string
  categoryLabel?: string    // e.g. "Attack", "3rd Level Evocation", "Feat"
  badges?: string[]         // e.g. "Concentration", "Ritual", "Prepared"
  stats?: DetailStat[]      // quick-glance grid — Range/Hit/Damage, Casting Time/Duration, etc.
  notes?: string            // short reference line (weapon properties, etc.)
  description?: string
  usesLabel?: string        // e.g. "3/3 uses — Long Rest"
}

// A single reusable "what does this actually do" popup — click a name
// anywhere (Actions, Spells, Features, the Play tab) to read the full
// entry without navigating into its edit form. Editing stays a deliberate,
// separate action (the pencil icon on each row).
export function DetailCard({ onClose, title, categoryLabel, badges, stats, notes, description, usesLabel }: Props) {
  const hasContent = (stats && stats.length > 0) || notes || description || usesLabel

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal max-w-sm max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-white leading-tight">{title}</h2>
            {categoryLabel && <p className="text-xs text-amber-400/70 mt-0.5">{categoryLabel}</p>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span key={b} className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/10 border border-amber-500/25 text-amber-300">
                  {b}
                </span>
              ))}
            </div>
          )}

          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 bg-surface-overlay/60 rounded-lg p-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</p>
                  <p className="text-sm text-slate-200 font-medium">{s.value || '—'}</p>
                </div>
              ))}
            </div>
          )}

          {notes && <p className="text-xs text-slate-500 leading-relaxed">{notes}</p>}

          {description && (
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{description}</p>
          )}

          {!hasContent && <p className="text-xs text-slate-600 italic">Nothing else written for this yet.</p>}
        </div>

        {usesLabel && (
          <div className="px-5 py-2.5 border-t border-border flex-shrink-0 text-xs text-slate-500">
            {usesLabel}
          </div>
        )}
      </div>
    </div>
  )
}
