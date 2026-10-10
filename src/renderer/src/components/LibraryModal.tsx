import { useMemo, useState } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { ModalShell } from './ModalShell'

export interface LibraryItem {
  key: string
  name: string
  meta: string // one-line summary shown under the name
  group: string // filter chip it belongs to
}

interface Props {
  title: string
  items: LibraryItem[]
  groups: string[]
  alreadyHave: Set<string> // lower-cased names already on the sheet
  onPick: (key: string) => Promise<void>
  onClose: () => void
}

// A searchable catalogue to add from. Stays open after each pick so several
// entries can be added in one go; entries already on the sheet are marked.
export function LibraryModal({ title, items, groups, alreadyHave, onPick, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string>('All')
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => (group === 'All' || i.group === group) && (!q || i.name.toLowerCase().includes(q)))
  }, [items, query, group])

  async function pick(key: string) {
    setBusy(key)
    try {
      await onPick(key)
      setAdded((s) => new Set(s).add(key))
    } finally {
      setBusy(null)
    }
  }

  return (
    <ModalShell onClose={onClose} className="max-w-lg max-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <h2 className="font-display text-base font-semibold text-white uppercase tracking-widest">{title}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors"><X size={16} /></button>
      </div>

      <div className="px-5 pt-3 pb-2 space-y-2 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            className="input text-sm pl-8"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {['All', ...groups].map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`px-2.5 py-1 text-[11px] border transition-colors ${
                group === g ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto border-t border-border">
        {shown.length === 0 && <li className="text-xs text-slate-600 text-center py-8">Nothing matches.</li>}
        {shown.map((i) => {
          const have = alreadyHave.has(i.name.toLowerCase()) || added.has(i.key)
          return (
            <li key={i.key}>
              <button
                onClick={() => pick(i.key)}
                disabled={busy === i.key}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-white/[0.04] transition-colors border-b border-border/50"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-slate-100 truncate">{i.name}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{i.meta}</span>
                </span>
                {have ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 flex-shrink-0">
                    <Check size={12} /> {added.has(i.key) ? 'Added' : 'Have'}
                  </span>
                ) : (
                  <Plus size={14} className="text-amber-400 flex-shrink-0" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </ModalShell>
  )
}
