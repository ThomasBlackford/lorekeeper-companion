import type { AbilityScoreKey, Character } from '../types'
import { VitalsRow } from './VitalsRow'
import { AbilityScores } from './AbilityScores'

interface Props {
  character: Character
  onVitalsChange: (changes: Partial<Pick<Character, 'ac' | 'proficiency_bonus' | 'speed' | 'initiative'>>) => void
  onScoreChange: (key: AbilityScoreKey, value: number) => void
}

export function CoreStatsCard({ character, onVitalsChange, onScoreChange }: Props) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Combat Stats</h2>
      <VitalsRow character={character} onChange={onVitalsChange} />
      <AbilityScores character={character} onChange={onScoreChange} />
    </div>
  )
}
