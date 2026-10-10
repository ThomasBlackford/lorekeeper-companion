import { useState } from 'react'
import { Dices, X, Trash2 } from 'lucide-react'
import { useRolls } from '../contexts/RollContext'
import type { RollEntry } from '../contexts/RollContext'
import type { RollMode } from '../lib/dice'

const DICE = [4, 6, 8, 10, 12, 20, 100]

const MODES: { value: RollMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'adv', label: 'Advantage' },
  { value: 'dis', label: 'Disadvantage' }
]

// The headline result of the most recent roll, anywhere in the app — the
// number you actually need, big, for a few seconds.
export function RollToast() {
  const { toast } = useRolls()
  if (!toast) return null
  const tone = toast.crit ? 'border-emerald-400/70' : toast.fumble ? 'border-red-500/70' : 'border-amber-500/50'
  return (
    <div
      key={toast.id}
      className={`animate-popover fixed top-5 left-1/2 -translate-x-1/2 z-[55] bg-surface-raised border ${tone} shadow-2xl px-6 py-3 flex items-center gap-5 min-w-[16rem] pointer-events-none`}
    >
      <span className="font-display text-4xl font-semibold text-white leading-none">{toast.total}</span>
      <div className="min-w-0">
        <p className="text-sm text-slate-200 font-medium truncate">{toast.label}</p>
        <p className="text-[11px] text-slate-500 truncate">
          {toast.formula} · {toast.detail}
        </p>
        {toast.crit && toast.kind === 'check' && <p className="text-[10px] uppercase tracking-widest text-emerald-400">Natural 20</p>}
        {toast.fumble && <p className="text-[10px] uppercase tracking-widest text-red-400">Natural 1</p>}
        {toast.crit && toast.kind === 'damage' && <p className="text-[10px] uppercase tracking-widest text-emerald-400">Critical damage</p>}
      </div>
    </div>
  )
}

function Entry({ e }: { e: RollEntry }) {
  return (
    <li className="flex items-center gap-3 px-3 py-1.5 border-b border-border/60 last:border-0">
      <span
        className={`font-display text-lg w-11 text-center flex-shrink-0 ${
          e.crit ? 'text-emerald-300' : e.fumble ? 'text-red-400' : 'text-white'
        }`}
      >
        {e.total}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-300 truncate">{e.label}</p>
        <p className="text-[10px] text-slate-600 truncate">{e.formula} · {e.detail}</p>
      </div>
    </li>
  )
}

// A floating dice tray: quick dice, a free-form expression, an
// advantage/disadvantage switch, and the session's roll history.
export function RollPanel() {
  const { log, mode, setMode, rollFree, rollCheck, clearLog } = useRolls()
  const [open, setOpen] = useState(false)
  const [expr, setExpr] = useState('')
  const [count, setCount] = useState(1)
  const [error, setError] = useState(false)

  function roll(expression: string) {
    const entry = rollFree(expression)
    setError(!entry)
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Dice"
        className="fixed bottom-4 right-[4.25rem] z-40 w-11 h-11 flex items-center justify-center rounded-full bg-surface-raised border border-border text-slate-400 shadow-lg hover:text-amber-300 hover:border-amber-500/50 transition-colors"
      >
        <Dices size={17} />
      </button>

      {open && (
        <div className="fixed bottom-[4.75rem] right-4 z-40 w-80 max-h-[32rem] bg-surface-raised border border-border shadow-2xl flex flex-col animate-popover origin-bottom-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <h3 className="font-display text-sm font-semibold text-white uppercase tracking-widest">Dice</h3>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="p-3 space-y-3 border-b border-border flex-shrink-0">
            <div className="grid grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`py-1.5 text-[10px] uppercase tracking-wider border transition-colors ${
                    mode === m.value ? 'bg-amber-500/25 border-amber-500/60 text-white' : 'border-border text-slate-500 hover:text-slate-300'
                  }`}
                  title="Applies to the next d20 roll"
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Count</span>
              <div className="flex items-center border border-border">
                <button className="w-6 h-6 text-slate-400 hover:text-white" onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
                <span className="w-7 text-center text-xs text-white">{count}</span>
                <button className="w-6 h-6 text-slate-400 hover:text-white" onClick={() => setCount((c) => Math.min(20, c + 1))}>+</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {DICE.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    // A single d20 honours advantage/disadvantage; everything
                    // else is a plain sum.
                    if (d === 20 && count === 1) rollCheck('d20', 0)
                    else roll(`${count}d${d}`)
                  }}
                  className="py-2 text-xs border border-border text-slate-300 hover:text-white hover:border-amber-500/60 transition-colors"
                >
                  d{d}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                className={`input text-xs py-1.5 ${error ? 'border-red-500/60' : ''}`}
                placeholder="2d6 + 3"
                value={expr}
                onChange={(e) => { setExpr(e.target.value); setError(false) }}
                onKeyDown={(e) => e.key === 'Enter' && expr.trim() && roll(expr)}
              />
              <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => expr.trim() && roll(expr)}>Roll</button>
            </div>
            {error && <p className="text-[11px] text-red-400">Couldn't read that — try something like 2d6+3.</p>}
          </div>

          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">History</span>
            {log.length > 0 && (
              <button onClick={clearLog} className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-300">
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>
          <ul className="flex-1 overflow-y-auto min-h-[4rem]">
            {log.length === 0 ? (
              <li className="text-xs text-slate-600 text-center py-6">Nothing rolled yet.</li>
            ) : (
              log.map((e) => <Entry key={e.id} e={e} />)
            )}
          </ul>
        </div>
      )}
    </>
  )
}
