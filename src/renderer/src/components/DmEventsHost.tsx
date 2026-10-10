import { useEffect, useRef, useState } from 'react'
import { Dices, Swords, ScrollText } from 'lucide-react'
import type { AbilityScoreKey, Character, DmEvent } from '../types'
import { ModalShell } from './ModalShell'
import { useRolls } from '../contexts/RollContext'
import { notifyInfo } from '../lib/notify'
import { ABILITY_LABELS, SKILLS, abilityMod, fmtMod, saveModifier, skillModifier } from '../lib/dnd'

type RollRequest = Extract<DmEvent['cmd'], { cmd: 'roll_request' }>

const ABILITY_KEYS: Record<string, AbilityScoreKey> = {
  str: 'str_score', dex: 'dex_score', con: 'con_score', int: 'int_score', wis: 'wis_score', cha: 'cha_score'
}

// What this character adds to the roll the DM asked for.
function modifierFor(c: Character, req: RollRequest): number {
  if (req.kind === 'save' && req.ability && ABILITY_KEYS[req.ability]) {
    const key = ABILITY_KEYS[req.ability]
    return saveModifier(c, key, c.save_proficiencies.includes(key))
  }
  if (req.kind === 'check' && req.ability && ABILITY_KEYS[req.ability]) {
    return abilityMod(c[ABILITY_KEYS[req.ability]])
  }
  if (req.kind === 'skill' && req.skill) {
    const def = SKILLS.find((s) => s.key === req.skill)
    if (def) return skillModifier(c, def, c.skills[def.key] ?? 'none')
  }
  if (req.kind === 'initiative') return abilityMod(c.dex_score) + c.initiative_bonus
  return 0
}

interface Props {
  character: Character
  onCharacter: (c: Character) => void
}

// Receives everything the DM pushes: shows heads-ups for state changes the
// main process already applied, prompts for requested rolls, flags your turn,
// and displays handouts.
export function DmEventsHost({ character, onCharacter }: Props) {
  const rolls = useRolls()
  const [requests, setRequests] = useState<RollRequest[]>([])
  const [rolled, setRolled] = useState<{ total: number; natural: number } | null>(null)
  const [handout, setHandout] = useState<Extract<DmEvent['cmd'], { cmd: 'handout' }> | null>(null)
  const [turn, setTurn] = useState<{ state: 'your_turn' | 'up_next'; round: number } | null>(null)
  const turnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const promptRef = useRef(rolls.promptConcentration)
  promptRef.current = rolls.promptConcentration

  useEffect(() => window.api.sync.onCharacterChanged(onCharacter), [onCharacter])

  useEffect(
    () =>
      window.api.sync.onDmEvent((evt) => {
        const cmd = evt.cmd
        switch (cmd.cmd) {
          case 'roll_request':
            setRequests((q) => [...q, cmd])
            break
          case 'turn':
            setTurn({ state: cmd.state, round: cmd.round })
            if (turnTimer.current) clearTimeout(turnTimer.current)
            turnTimer.current = setTimeout(() => setTurn(null), cmd.state === 'your_turn' ? 12000 : 7000)
            break
          case 'handout':
            setHandout(cmd)
            break
          case 'hp_delta':
            notifyInfo(evt.summary)
            // Taking damage while concentrating means a Constitution save.
            if (evt.extra?.kind === 'damage' && evt.extra.concentration && (evt.extra.amount ?? 0) > 0) {
              promptRef.current(evt.extra.amount!)
            }
            break
          default:
            notifyInfo(evt.summary)
        }
      }),
    []
  )

  const current = requests[0] ?? null

  function doRoll() {
    if (!current) return
    const mod = modifierFor(character, current)
    const entry = rolls.rollCheck(current.label, mod, { report: { rollId: current.rollId, dc: current.dc ?? null } })
    setRolled({ total: entry.total, natural: entry.natural ?? entry.total })
  }

  function nextRequest() {
    setRolled(null)
    setRequests((q) => q.slice(1))
  }

  return (
    <>
      {turn && (
        <div
          className={`fixed top-0 inset-x-0 z-[58] flex items-center justify-center gap-3 py-2.5 text-white animate-fade-in cursor-pointer ${
            turn.state === 'your_turn' ? 'text-sm font-semibold uppercase tracking-[0.3em]' : 'text-xs uppercase tracking-widest'
          }`}
          style={{ background: 'var(--gradient-brand)' }}
          onClick={() => setTurn(null)}
        >
          <Swords size={turn.state === 'your_turn' ? 16 : 13} />
          {turn.state === 'your_turn' ? `Your turn · round ${turn.round}` : "You're up next"}
        </div>
      )}

      {current && (
        <ModalShell onClose={() => { if (rolled) nextRequest() }} className="max-w-sm p-6">
          <div className="text-center space-y-4">
            <Dices size={26} className="mx-auto text-amber-400" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">The DM asks for</p>
            <h2 className="font-display text-xl font-semibold text-white">{current.label}</h2>
            <p className="text-xs text-slate-500">
              Your modifier: <span className="text-slate-200">{fmtMod(modifierFor(character, current))}</span>
              {current.kind === 'save' && current.ability && ABILITY_KEYS[current.ability] && (
                <span> ({ABILITY_LABELS[ABILITY_KEYS[current.ability]]})</span>
              )}
            </p>
            {rolled ? (
              <>
                <p className="font-display text-5xl text-white">{rolled.total}</p>
                <p className="text-[11px] text-slate-500">Sent to the DM{rolled.natural === 20 ? ' — natural 20!' : rolled.natural === 1 ? ' — natural 1.' : '.'}</p>
                <button className="btn-primary w-full" onClick={nextRequest}>
                  {requests.length > 1 ? `Next request (${requests.length - 1} more)` : 'Done'}
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1 text-[10px] uppercase tracking-wider">
                  {(['normal', 'adv', 'dis'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => rolls.setMode(m)}
                      className={`py-1.5 border transition-colors ${rolls.mode === m ? 'bg-amber-500/25 border-amber-500/60 text-white' : 'border-border text-slate-500 hover:text-slate-300'}`}
                    >
                      {m === 'normal' ? 'Normal' : m === 'adv' ? 'Advantage' : 'Disadvantage'}
                    </button>
                  ))}
                </div>
                <button className="btn-primary w-full text-base py-3" onClick={doRoll}>Roll d20</button>
                <button className="text-[11px] text-slate-600 hover:text-slate-300" onClick={nextRequest}>Skip</button>
              </>
            )}
          </div>
        </ModalShell>
      )}

      {handout && (
        <ModalShell onClose={() => setHandout(null)} className="max-w-xl max-h-[90vh] flex flex-col">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border flex-shrink-0">
            <ScrollText size={15} className="text-amber-400" />
            <h2 className="font-display text-base font-semibold text-white">{handout.title}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {handout.imageDataUrl && <img src={handout.imageDataUrl} alt={handout.title} className="w-full" draggable={false} />}
            {handout.text && <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{handout.text}</p>}
          </div>
          <div className="px-5 py-3 border-t border-border flex-shrink-0 flex justify-end">
            <button className="btn-primary text-sm" onClick={() => setHandout(null)}>Close</button>
          </div>
        </ModalShell>
      )}
    </>
  )
}
