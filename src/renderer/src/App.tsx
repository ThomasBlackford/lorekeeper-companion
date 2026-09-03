import { useEffect, useState } from 'react'
import type { AbilityScoreKey, Character } from './types'
import { useSettings } from './contexts/SettingsContext'
import { CharacterHeader } from './components/CharacterHeader'
import { CoreStatsCard } from './components/CoreStatsCard'
import { HpCard } from './components/HpCard'
import { RestButtons } from './components/RestButtons'
import { DefensesList } from './components/DefensesList'
import { ConditionsCard } from './components/ConditionsCard'
import { PassiveScoresCard } from './components/PassiveScoresCard'
import { CharacterTabsCard } from './components/CharacterTabsCard'
import { NotesSection } from './components/NotesSection'
import { SettingsButton } from './components/SettingsButton'
import { ChatWidget } from './components/ChatWidget'
import { UpdateBanner } from './components/UpdateBanner'

export function App() {
  const { layout } = useSettings()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.character.get().then((c) => {
      setCharacter(c)
      setLoading(false)
    })
  }, [])

  async function handleSaveHeader(
    changes: Partial<Pick<Character, 'name' | 'race' | 'class' | 'level' | 'alignment'>>
  ) {
    const c = await window.api.character.save(changes)
    setCharacter(c)
  }

  async function handleVitalsChange(
    changes: Partial<Pick<Character, 'ac' | 'proficiency_bonus' | 'speed' | 'initiative'>>
  ) {
    const c = await window.api.character.save(changes)
    setCharacter(c)
  }

  async function handleScoreChange(key: AbilityScoreKey, value: number) {
    const c = await window.api.character.save({ [key]: value })
    setCharacter(c)
  }

  async function handleHpChange(changes: { hp_current?: number | null; hp_max?: number | null }) {
    const c = await window.api.character.save(changes)
    setCharacter(c)
  }

  async function handleDefensesChange(defenses: Character['defenses']) {
    const c = await window.api.character.updateDefenses(defenses)
    setCharacter(c)
  }

  async function handleConditionsChange(conditions: Character['conditions']) {
    const c = await window.api.character.updateConditions(conditions)
    setCharacter(c)
  }

  async function handleNotesChange(notes: string) {
    const c = await window.api.character.save({ notes })
    setCharacter(c)
  }

  async function handleShortRest() {
    const c = await window.api.rest.short()
    setCharacter(c)
  }

  async function handleLongRest() {
    if (!confirm('Take a long rest? This restores long-rest abilities and all spell slots.')) return
    const c = await window.api.rest.long()
    setCharacter(c)
  }

  if (loading || !character) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-600 text-sm">Loading…</p>
      </div>
    )
  }

  const isWide = layout === 'wide'

  const sidebar = (
    <>
      <CharacterHeader character={character} onSave={handleSaveHeader} />

      <CoreStatsCard
        character={character}
        onVitalsChange={handleVitalsChange}
        onScoreChange={handleScoreChange}
      />

      <div className={isWide ? 'space-y-5' : 'grid sm:grid-cols-2 gap-5'}>
        <HpCard character={character} onChange={handleHpChange} />
        <div className="bg-surface-raised border border-border rounded-xl p-4 flex flex-col justify-center gap-3">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Rest</h2>
          <RestButtons onShortRest={handleShortRest} onLongRest={handleLongRest} />
        </div>
      </div>

      <div className={isWide ? 'space-y-5' : 'grid sm:grid-cols-2 gap-5'}>
        <DefensesList defenses={character.defenses} onChange={handleDefensesChange} />
        <ConditionsCard conditions={character.conditions} onChange={handleConditionsChange} />
      </div>

      <PassiveScoresCard character={character} />
    </>
  )

  const main = (
    <>
      <CharacterTabsCard character={character} onUpdate={setCharacter} />
      <NotesSection notes={character.notes} onChange={handleNotesChange} />
    </>
  )

  return (
    <>
      <div className="h-screen overflow-y-auto bg-surface-base">
        {isWide ? (
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="grid grid-cols-[340px_1fr] gap-6 items-start">
              <div className="space-y-5">{sidebar}</div>
              <div className="space-y-5">{main}</div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
            {sidebar}
            {main}
          </div>
        )}
      </div>

      <SettingsButton />
      <ChatWidget character={character} onUpdate={setCharacter} />
      <UpdateBanner />
    </>
  )
}
