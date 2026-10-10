import { useEffect, useState } from 'react'
import type { AbilityScoreKey, Character } from './types'
import { useSettings } from './contexts/SettingsContext'
import { proficiencyBonusForLevel } from './lib/dnd'
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
import { ToastHost } from './components/ToastHost'
import { RollToast, RollPanel } from './components/RollPanel'
import { DmEventsHost } from './components/DmEventsHost'
import { ConcentrationPrompt } from './components/ConcentrationPrompt'
import { useConfirm } from './hooks/useConfirm'

export function App() {
  const { layout } = useSettings()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { ask, dialog } = useConfirm()

  useEffect(() => {
    window.api.character
      .get()
      .then((c) => setCharacter(c))
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveHeader(
    changes: Partial<Pick<Character, 'name' | 'race' | 'class' | 'level' | 'alignment' | 'inspiration' | 'xp'>>
  ) {
    const c = await window.api.character.save(changes)
    setCharacter(c)
  }

  // Levelling up moves the things that depend on level along with it: the
  // proficiency bonus, and one more Hit Die (which also comes back full).
  async function handleLevelUp() {
    if (!character) return
    const next = Math.min(20, character.level + 1)
    const c = await window.api.character.save({
      level: next,
      proficiency_bonus: proficiencyBonusForLevel(next),
      hit_dice_total: (character.hit_dice_total ?? character.level) + 1,
      hit_dice_current: (character.hit_dice_current ?? character.hit_dice_total ?? character.level) + 1
    })
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

  async function handleHpChange(
    changes: Partial<Pick<Character,
      'hp_current' | 'hp_max' | 'hp_temp' | 'death_save_successes' | 'death_save_failures'
      | 'hit_dice_total' | 'hit_dice_current' | 'hit_die_size'
    >>
  ) {
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

  function handleLongRest() {
    ask({
      title: 'Take a long rest?',
      message: 'Restores long-rest abilities, all spell slots, and half your spent Hit Dice, and clears temporary HP.',
      confirmLabel: 'Long rest',
      onYes: async () => setCharacter(await window.api.rest.long())
    })
  }

  if (loading || !character) {
    return (
      <div className="h-screen flex items-center justify-center p-6 text-center">
        {loadError ? (
          <div className="space-y-3 max-w-sm">
            <p className="text-sm text-slate-300">Couldn't load your character.</p>
            <p className="text-xs text-red-300/80">{loadError}</p>
            <button className="btn-primary text-sm" onClick={() => window.location.reload()}>Reload</button>
          </div>
        ) : (
          <p className="text-slate-600 text-sm">Loading…</p>
        )}
      </div>
    )
  }

  const isWide = layout === 'wide'

  const sidebar = (
    <>
      <CharacterHeader character={character} onSave={handleSaveHeader} onCharacter={setCharacter} onLevelUp={handleLevelUp} />

      <CoreStatsCard
        character={character}
        onVitalsChange={handleVitalsChange}
        onScoreChange={handleScoreChange}
      />

      <div className={isWide ? 'space-y-5' : 'grid sm:grid-cols-2 gap-5'}>
        <HpCard character={character} onChange={handleHpChange} onCharacter={setCharacter} />
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
      <div className="app-topbar" />
      <div className="h-screen overflow-y-auto">
        {isWide ? (
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Two columns only once there is room for them; narrower windows stack. */}
            <div className="grid grid-cols-1 min-[900px]:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
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
      <ToastHost />
      <RollToast />
      <RollPanel />
      <DmEventsHost character={character} onCharacter={setCharacter} />
      <ConcentrationPrompt character={character} onCharacter={setCharacter} />
      {dialog}
    </>
  )
}
