import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Character } from '../types'
import { ModalShell } from './ModalShell'
import { useRolls } from '../contexts/RollContext'
import { abilityMod, fmtMod } from '../lib/dnd'

interface Props {
  character: Character
  onCharacter: (c: Character) => void
}

// Taking damage while concentrating forces a Constitution save, DC 10 or half
// the damage (whichever is higher). This does the maths, rolls it with your
// real CON modifier, and offers to drop the spell on a failure.
export function ConcentrationPrompt({ character, onCharacter }: Props) {
  const rolls = useRolls()
  const [result, setResult] = useState<{ total: number; pass: boolean } | null>(null)
  const pending = rolls.concentration
  if (!pending || !character.concentration_spell_name) return null

  const dc = Math.max(10, Math.floor(pending.damage / 2))
  const mod = abilityMod(character.con_score) + (character.save_proficiencies.includes('con_score') ? character.proficiency_bonus ?? 0 : 0)

  function close() {
    setResult(null)
    rolls.dismissConcentration()
  }

  function roll() {
    const entry = rolls.rollCheck('Concentration save', mod)
    setResult({ total: entry.total, pass: entry.total >= dc })
  }

  async function drop() {
    onCharacter(await window.api.character.save({ concentration_spell_name: '' }))
    close()
  }

  return (
    <ModalShell onClose={close} className="max-w-sm p-6">
      <div className="text-center space-y-4">
        <Sparkles size={24} className="mx-auto text-purple-300" />
        <h2 className="font-display text-lg font-semibold text-white">Concentration check</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          You took {pending.damage} damage while concentrating on{' '}
          <span className="text-purple-200">{character.concentration_spell_name}</span>.
        </p>
        <p className="text-xs text-slate-500">
          Constitution save <span className="text-slate-200">{fmtMod(mod)}</span> · DC <span className="text-white font-semibold">{dc}</span>
        </p>

        {result ? (
          <>
            <p className={`font-display text-4xl ${result.pass ? 'text-emerald-300' : 'text-red-400'}`}>{result.total}</p>
            <p className={`text-sm ${result.pass ? 'text-emerald-300' : 'text-red-300'}`}>
              {result.pass ? 'You keep concentrating.' : 'Concentration broken.'}
            </p>
            {result.pass ? (
              <button className="btn-primary w-full" onClick={close}>Continue</button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-danger" onClick={drop}>Drop the spell</button>
                <button className="btn-ghost" onClick={close}>Keep (DM override)</button>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={roll}>Roll save</button>
            <button className="btn-ghost" onClick={close}>Skip</button>
          </div>
        )}
      </div>
    </ModalShell>
  )
}
