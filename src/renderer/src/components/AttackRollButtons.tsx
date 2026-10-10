import { useState } from 'react'
import { Dices, Swords } from 'lucide-react'
import type { AttackKind } from '../types'
import { useRolls } from '../contexts/RollContext'
import { fmtMod } from '../lib/dnd'
import { parseDice } from '../lib/dice'

interface Props {
  name: string
  attackKind: AttackKind
  hit: number | null // to-hit bonus, or the save DC for save-based attacks
  damage: string
  compact?: boolean
}

// One-tap rolls for an attack: the d20 to hit (with your actual bonus) and its
// damage. A natural 20 on the attack automatically doubles the dice on the next
// damage roll, so crits don't depend on remembering to.
export function AttackRollButtons({ name, attackKind, hit, damage, compact }: Props) {
  const rolls = useRolls()
  const [critNext, setCritNext] = useState(false)
  const canAttack = attackKind === 'attack_roll' && hit != null
  const canDamage = damage.trim() !== '' && parseDice(damage) != null
  if (!canAttack && !canDamage) return null

  function attack(e: React.MouseEvent) {
    e.stopPropagation()
    const mode = e.shiftKey ? 'adv' : e.altKey ? 'dis' : undefined
    const entry = rolls.rollCheck(`${name} — attack`, hit ?? 0, { mode })
    setCritNext(!!entry.crit)
  }

  function dmg(e: React.MouseEvent) {
    e.stopPropagation()
    rolls.rollDamage(`${name} — damage`, damage, critNext)
    setCritNext(false)
  }

  const size = compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-2 text-xs'
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {canAttack && (
        <button
          onClick={attack}
          title="Roll to hit — Shift for advantage, Alt for disadvantage"
          className={`${size} flex items-center gap-1 border border-amber-500/40 text-amber-300 hover:bg-amber-500/15 transition-colors uppercase tracking-wider`}
        >
          <Dices size={compact ? 10 : 13} /> {fmtMod(hit ?? 0)}
        </button>
      )}
      {canDamage && (
        <button
          onClick={dmg}
          title={critNext ? 'Critical hit — dice doubled' : 'Roll damage'}
          className={`${size} flex items-center gap-1 border transition-colors uppercase tracking-wider ${
            critNext
              ? 'border-emerald-400/70 text-emerald-300 bg-emerald-500/10 animate-pulse'
              : 'border-border text-slate-300 hover:text-white hover:border-slate-500'
          }`}
        >
          <Swords size={compact ? 10 : 13} /> {compact ? 'Dmg' : `Damage ${damage}`}
        </button>
      )}
    </div>
  )
}
