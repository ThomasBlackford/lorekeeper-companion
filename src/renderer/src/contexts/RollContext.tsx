import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { describeRoll, rollD20, rollDice } from '../lib/dice'
import type { RollMode } from '../lib/dice'
import { fmtMod } from '../lib/dnd'

export interface RollEntry {
  id: number
  at: number
  label: string
  formula: string // "d20 +5" / "2d6 + 3"
  detail: string // the individual dice, for the log
  total: number
  kind: 'check' | 'damage' | 'free'
  natural?: number
  crit?: boolean
  fumble?: boolean
}

interface CheckOptions {
  // Send the result to the DM (for requested rolls, or if the player opts in).
  report?: { rollId?: string; dc?: number | null }
  mode?: RollMode
}

interface RollApi {
  log: RollEntry[]
  toast: RollEntry | null
  mode: RollMode
  setMode: (m: RollMode) => void
  rollCheck: (label: string, modifier: number, opts?: CheckOptions) => RollEntry
  rollDamage: (label: string, expression: string, crit?: boolean) => RollEntry | null
  rollFree: (expression: string) => RollEntry | null
  clearLog: () => void
  concentration: { damage: number } | null
  promptConcentration: (damage: number) => void
  dismissConcentration: () => void
}

const RollContext = createContext<RollApi | null>(null)

const MAX_LOG = 40
const TOAST_MS = 5000

// Everything that rolls dice goes through here, so there's one history, one
// advantage/disadvantage control, and one place results are shown and (when
// the DM asked for them) reported back.
export function RollProvider({ children }: { children: ReactNode }) {
  const [log, setLog] = useState<RollEntry[]>([])
  const [toast, setToast] = useState<RollEntry | null>(null)
  const [mode, setMode] = useState<RollMode>('normal')
  const [concentration, setConcentration] = useState<{ damage: number } | null>(null)
  const idRef = useRef(1)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const push = useCallback((entry: Omit<RollEntry, 'id' | 'at'>): RollEntry => {
    const full: RollEntry = { ...entry, id: idRef.current++, at: Date.now() }
    setLog((l) => [full, ...l].slice(0, MAX_LOG))
    setToast(full)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS)
    return full
  }, [])

  const rollCheck = useCallback(
    (label: string, modifier: number, opts: CheckOptions = {}): RollEntry => {
      const useMode = opts.mode ?? mode
      const r = rollD20(modifier, useMode)
      const entry = push({
        label,
        formula: `d20 ${fmtMod(modifier)}${useMode === 'adv' ? ' (adv)' : useMode === 'dis' ? ' (dis)' : ''}`,
        detail: r.other != null ? `[${r.natural}, ${r.other}] → ${r.natural}` : `[${r.natural}]`,
        total: r.total,
        kind: 'check',
        natural: r.natural,
        crit: r.natural === 20,
        fumble: r.natural === 1
      })
      // Advantage/disadvantage applies to one roll, not every roll after it.
      if (mode !== 'normal' && !opts.mode) setMode('normal')
      if (opts.report) {
        window.api.sync
          .sendRollResult({
            rollId: opts.report.rollId,
            label,
            total: r.total,
            natural: r.natural,
            modifier,
            dc: opts.report.dc ?? null
          })
          .catch(() => {})
      }
      return entry
    },
    [mode, push]
  )

  const rollDamage = useCallback(
    (label: string, expression: string, crit = false): RollEntry | null => {
      const r = rollDice(expression, { crit })
      if (!r) return null
      return push({
        label,
        formula: crit ? `${expression} (crit)` : expression,
        detail: describeRoll(r),
        total: r.total,
        kind: 'damage',
        crit
      })
    },
    [push]
  )

  const rollFree = useCallback(
    (expression: string): RollEntry | null => {
      const r = rollDice(expression)
      if (!r) return null
      return push({ label: 'Roll', formula: expression.trim(), detail: describeRoll(r), total: r.total, kind: 'free' })
    },
    [push]
  )

  const value: RollApi = {
    log,
    toast,
    mode,
    setMode,
    rollCheck,
    rollDamage,
    rollFree,
    clearLog: () => setLog([]),
    concentration,
    promptConcentration: (damage) => setConcentration({ damage }),
    dismissConcentration: () => setConcentration(null)
  }

  return <RollContext.Provider value={value}>{children}</RollContext.Provider>
}

export function useRolls(): RollApi {
  const ctx = useContext(RollContext)
  if (!ctx) throw new Error('useRolls must be used within a RollProvider')
  return ctx
}
