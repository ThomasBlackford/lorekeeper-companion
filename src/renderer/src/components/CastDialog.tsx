import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Character, Spell } from '../types'
import { ModalShell } from './ModalShell'
import { AttackRollButtons } from './AttackRollButtons'
import { spellStats } from '../lib/dnd'

interface Props {
  spell: Spell
  character: Character
  onClose: () => void
  onUpdate: (c: Character) => void
}

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
}

// Casting a leveled spell spends a slot — at its own level, or higher to
// upcast. Concentration spells also take over your concentration (ending the
// previous one). The roll buttons appear once it's cast.
export function CastDialog({ spell, character, onClose, onUpdate }: Props) {
  const isCantrip = spell.level === 0
  const options = useMemo(
    () =>
      character.spellSlots
        .filter((s) => s.level >= spell.level && s.max > 0)
        .sort((a, b) => a.level - b.level),
    [character.spellSlots, spell.level]
  )
  const firstAvailable = options.find((s) => s.current > 0)
  const [slotLevel, setSlotLevel] = useState<number | null>(firstAvailable?.level ?? options[0]?.level ?? null)
  const [cast, setCast] = useState<{ upcastAt: number | null } | null>(null)
  const [busy, setBusy] = useState(false)

  const chosen = options.find((s) => s.level === slotLevel)
  const noSlot = !isCantrip && (!chosen || chosen.current <= 0)
  const replacing =
    spell.concentration && character.concentration_spell_name && character.concentration_spell_name !== spell.name
      ? character.concentration_spell_name
      : null
  const stats = spellStats(character)
  const hit = spell.attack_kind === 'save_dc' ? stats?.saveDc ?? null : spell.attack_kind === 'attack_roll' ? stats?.attackBonus ?? null : null

  async function doCast() {
    setBusy(true)
    let c = character
    if (!isCantrip && chosen) {
      c = await window.api.spellSlots.update(chosen.level, { current: chosen.current - 1 })
    }
    if (spell.concentration) {
      c = await window.api.character.save({ concentration_spell_name: spell.name })
    }
    onUpdate(c)
    setBusy(false)
    setCast({ upcastAt: !isCantrip && slotLevel != null && slotLevel > spell.level ? slotLevel : null })
  }

  return (
    <ModalShell onClose={onClose} className="max-w-sm p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <Sparkles size={18} className="text-purple-300 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-white leading-tight">{spell.name}</h2>
            <p className="text-xs text-slate-500">
              {isCantrip ? 'Cantrip' : `${ordinal(spell.level)} level`}
              {spell.concentration && ' · Concentration'}
            </p>
          </div>
        </div>

        {!cast ? (
          <>
            {!isCantrip && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1.5">Cast using</p>
                {options.length === 0 ? (
                  <p className="text-xs text-red-300">
                    You have no spell slots of level {spell.level} or higher set up — add them in the Spells tab.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((s) => (
                      <button
                        key={s.level}
                        disabled={s.current <= 0}
                        onClick={() => setSlotLevel(s.level)}
                        className={`px-3 py-1.5 text-xs border transition-colors disabled:opacity-30 ${
                          slotLevel === s.level ? 'bg-amber-500/25 border-amber-500/60 text-white' : 'border-border text-slate-400 hover:text-white'
                        }`}
                      >
                        {ordinal(s.level)} <span className="text-slate-500">{s.current}/{s.max}</span>
                        {s.level > spell.level && <span className="text-amber-400 ml-1">↑</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {replacing && (
              <p className="text-xs text-amber-300 leading-relaxed">
                Casting this ends your concentration on {replacing}.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary" onClick={doCast} disabled={busy || noSlot}>
                {isCantrip ? 'Cast cantrip' : 'Cast spell'}
              </button>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
            </div>
            {noSlot && !isCantrip && options.length > 0 && <p className="text-xs text-red-300">No slots left at that level.</p>}
          </>
        ) : (
          <>
            <p className="text-sm text-emerald-300">
              Cast{cast.upcastAt ? ` at ${ordinal(cast.upcastAt)} level` : ''}.
              {spell.concentration && ' You are now concentrating.'}
            </p>
            {cast.upcastAt && (
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Upcast damage and effects vary by spell — add the extra dice from the spell description yourself.
              </p>
            )}
            <AttackRollButtons name={spell.name} attackKind={spell.attack_kind} hit={hit} damage={spell.damage} />
            {spell.attack_kind === 'save_dc' && hit != null && (
              <p className="text-xs text-slate-400">Targets save against <span className="text-white font-semibold">DC {hit}</span>.</p>
            )}
            <button className="btn-primary w-full" onClick={onClose}>Done</button>
          </>
        )}
      </div>
    </ModalShell>
  )
}
