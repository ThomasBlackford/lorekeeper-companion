import { useState, useEffect } from 'react'
import { Minus, Plus, Skull, Dices, Sparkles, X } from 'lucide-react'
import type { Character } from '../types'

function DeathSavePips({
  count, kind, onSet
}: {
  count: number
  kind: 'success' | 'failure'
  onSet: (n: number) => void
}) {
  const color = kind === 'success' ? 'bg-emerald-400 border-emerald-400' : 'bg-red-400 border-red-400'
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((i) => (
        <button
          key={i}
          onClick={() => onSet(count === i ? i - 1 : i)}
          className={`w-4 h-4 rounded-full border-2 transition-colors ${i <= count ? color : 'border-slate-600'}`}
        />
      ))}
    </div>
  )
}

interface Props {
  character: Character
  onChange: (changes: Partial<Pick<Character,
    'hp_current' | 'hp_max' | 'hp_temp' | 'death_save_successes' | 'death_save_failures'
    | 'hit_dice_total' | 'hit_dice_current' | 'hit_die_size'
  >>) => void
}

export function HpCard({ character, onChange }: Props) {
  const [current, setCurrent] = useState(String(character.hp_current ?? ''))
  const [max, setMax] = useState(String(character.hp_max ?? ''))
  const [temp, setTemp] = useState(String(character.hp_temp || ''))
  const [delta, setDelta] = useState('')
  const [rollFlash, setRollFlash] = useState<string | null>(null)
  const [hitDiceTotal, setHitDiceTotal] = useState(String(character.hit_dice_total ?? ''))

  useEffect(() => setCurrent(String(character.hp_current ?? '')), [character.hp_current])
  useEffect(() => setMax(String(character.hp_max ?? '')), [character.hp_max])
  useEffect(() => setHitDiceTotal(String(character.hit_dice_total ?? '')), [character.hit_dice_total])
  useEffect(() => setTemp(String(character.hp_temp || '')), [character.hp_temp])

  function commitCurrent() {
    const val = parseInt(current)
    onChange({ hp_current: isNaN(val) ? null : val })
  }

  function commitMax() {
    const val = parseInt(max)
    onChange({ hp_max: isNaN(val) ? null : val })
  }

  function commitTemp() {
    const val = parseInt(temp)
    onChange({ hp_temp: isNaN(val) ? 0 : Math.max(0, val) })
  }

  function applyDelta(sign: 1 | -1) {
    const amount = Math.abs(parseInt(delta))
    if (!amount) return

    if (sign === 1) {
      // Healing never restores temp HP, only the real pool.
      const base = character.hp_current ?? 0
      let next = base + amount
      if (character.hp_max != null) next = Math.min(character.hp_max, next)
      onChange({ hp_current: next })
      return
    }

    // Damage comes out of temp HP first, and any excess spills over into
    // real HP — the standard 5E rule, so the player doesn't have to split
    // the math themselves.
    const tempPool = character.hp_temp || 0
    const absorbed = Math.min(tempPool, amount)
    const remaining = amount - absorbed
    const base = character.hp_current ?? 0
    const nextCurrent = Math.max(0, base - remaining)
    onChange({ hp_temp: tempPool - absorbed, hp_current: nextCurrent })
  }

  async function handleSpendHitDie() {
    const result = await window.api.hitDice.spend()
    if (result.healed) setRollFlash(`Rolled ${result.rolled} → healed ${result.healed}`)
    setTimeout(() => setRollFlash(null), 3000)
  }

  function commitHitDiceTotal() {
    const val = parseInt(hitDiceTotal)
    const total = isNaN(val) ? null : Math.max(0, val)
    // Setting the pool size for the first time (or raising it, e.g. on
    // level-up) fills current to match — it only ever needs to be lowered
    // by hand if a homebrew rule calls for it.
    const current =
      character.hit_dice_current == null || total == null
        ? total
        : Math.min(total, character.hit_dice_current + Math.max(0, total - (character.hit_dice_total ?? 0)))
    onChange({ hit_dice_total: total, hit_dice_current: current })
  }

  async function handleDropConcentration() {
    await window.api.character.save({ concentration_spell_name: '' })
  }

  const isDown = character.hp_current != null && character.hp_current <= 0
  const stabilized = character.death_save_successes >= 3
  const dead = character.death_save_failures >= 3
  const hitDiceKnown = character.hit_dice_total != null

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Hit Points</h2>
        {isDown && (
          <span className={`flex items-center gap-1 text-xs ${dead ? 'text-red-400' : stabilized ? 'text-emerald-400' : 'text-slate-400'}`}>
            <Skull size={12} /> {dead ? 'Dead' : stabilized ? 'Stabilized' : 'Down'}
          </span>
        )}
      </div>

      {character.concentration_spell_name && (
        <div className="flex items-center justify-between gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25">
          <span className="flex items-center gap-1.5 text-xs text-purple-300 min-w-0">
            <Sparkles size={12} className="flex-shrink-0" />
            <span className="truncate">Concentrating: {character.concentration_spell_name}</span>
          </span>
          <button onClick={handleDropConcentration} title="Drop concentration" className="text-purple-400/60 hover:text-purple-200 flex-shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-2">
        <input
          className="w-20 text-center text-2xl font-display font-semibold bg-surface-overlay border border-border rounded-lg py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/60"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onBlur={commitCurrent}
          onKeyDown={(e) => e.key === 'Enter' && commitCurrent()}
        />
        <span className="text-slate-600 text-xl">/</span>
        <input
          className="w-16 text-center text-lg bg-surface-overlay border border-border rounded-lg py-1.5 text-slate-400 focus:outline-none focus:border-amber-500/60"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onBlur={commitMax}
          onKeyDown={(e) => e.key === 'Enter' && commitMax()}
        />
        <div className="flex items-center gap-1 ml-1">
          <span className="text-sky-400 text-lg">+</span>
          <input
            className="w-12 text-center text-lg bg-sky-500/10 border border-sky-500/25 rounded-lg py-1.5 text-sky-300 focus:outline-none focus:border-sky-500/60"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            onBlur={commitTemp}
            onKeyDown={(e) => e.key === 'Enter' && commitTemp()}
            title="Temporary HP"
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-3">
        <button
          onClick={() => applyDelta(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          title="Take damage"
        >
          <Minus size={16} />
        </button>
        <input
          className="w-14 text-center text-sm bg-surface-overlay border border-border rounded-lg py-1.5 text-slate-300 focus:outline-none focus:border-amber-500/60"
          value={delta}
          onChange={(e) => setDelta(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && applyDelta(-1)}
          placeholder="0"
        />
        <button
          onClick={() => applyDelta(1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          title="Heal"
        >
          <Plus size={16} />
        </button>
      </div>

      {isDown && !dead && (
        <div className="mb-3 pt-3 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-400/80 uppercase tracking-wider">Successes</span>
            <DeathSavePips
              count={character.death_save_successes}
              kind="success"
              onSet={(n) => onChange({ death_save_successes: n })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-red-400/80 uppercase tracking-wider">Failures</span>
            <DeathSavePips
              count={character.death_save_failures}
              kind="failure"
              onSet={(n) => onChange({ death_save_failures: n })}
            />
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-border">
        {hitDiceKnown ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Hit Dice <span className="text-slate-300 font-medium">{character.hit_dice_current ?? 0}/{character.hit_dice_total}</span>{' '}
              <select
                className="bg-transparent text-slate-500 focus:outline-none"
                value={character.hit_die_size}
                onChange={(e) => onChange({ hit_die_size: e.target.value })}
              >
                {['d6', 'd8', 'd10', 'd12'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </span>
            <button
              onClick={handleSpendHitDie}
              disabled={!character.hit_dice_current}
              title="Roll a Hit Die + CON modifier and heal"
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-amber-400 transition-colors"
            >
              <Dices size={12} /> Spend
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Hit Dice</span>
            <input
              className="w-10 text-center bg-surface-overlay border border-border rounded py-1 text-slate-300 focus:outline-none focus:border-amber-500/60"
              value={hitDiceTotal}
              onChange={(e) => setHitDiceTotal(e.target.value)}
              onBlur={commitHitDiceTotal}
              onKeyDown={(e) => e.key === 'Enter' && commitHitDiceTotal()}
              placeholder="—"
            />
            <span className="text-slate-600">{character.hit_die_size} (usually = level)</span>
          </div>
        )}
      </div>
      {rollFlash && <p className="text-[11px] text-emerald-400 text-right mt-1">{rollFlash}</p>}
    </div>
  )
}
