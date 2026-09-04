import { useState } from 'react'
import type { Character } from '../types'
import { ActionsSection } from './ActionsSection'
import { SpellsSection } from './SpellsSection'
import { InventorySection } from './InventorySection'
import { ResourceTracker } from './ResourceTracker'
import { AbilitiesSection } from './AbilitiesSection'
import { BackgroundSection } from './BackgroundSection'
import { SkillsSection } from './SkillsSection'
import { PlayModeSection } from './PlayModeSection'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

const TABS = [
  { id: 'play', label: 'Play' },
  { id: 'actions', label: 'Actions' },
  { id: 'skills', label: 'Skills' },
  { id: 'spells', label: 'Spells' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'resources', label: 'Resources' },
  { id: 'features', label: 'Features & Traits' },
  { id: 'background', label: 'Background' }
] as const

type TabId = (typeof TABS)[number]['id']

export function CharacterTabsCard({ character, onUpdate }: Props) {
  // "Play" — a read-only everything-at-once reference — is what the sheet
  // opens on, since that's what actually gets looked at during a session;
  // the editable tabs are one click away whenever something changes.
  const [tab, setTab] = useState<TabId>('play')

  async function handleResourcesChange(resources: Character['resources']) {
    const c = await window.api.character.updateResources(resources)
    onUpdate(c)
  }

  async function handleBackgroundChange(background: Character['background']) {
    const c = await window.api.character.updateBackground(background)
    onUpdate(c)
  }

  return (
    <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-1 px-2 pt-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-[color,border-color] duration-200 border-b-2 -mb-px ${
              tab === t.id
                ? 'text-amber-300 border-amber-400'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Keying on `tab` replays the fade-in on every switch — a cheap way
         to make tab content feel like it arrived rather than just swapped. */}
      <div key={tab} className="p-4 animate-fade-in">
        {tab === 'play' && <PlayModeSection character={character} />}
        {tab === 'actions' && <ActionsSection character={character} onUpdate={onUpdate} />}
        {tab === 'skills' && <SkillsSection character={character} onUpdate={onUpdate} />}
        {tab === 'spells' && <SpellsSection character={character} onUpdate={onUpdate} />}
        {tab === 'inventory' && <InventorySection character={character} onUpdate={onUpdate} />}
        {tab === 'resources' && (
          <ResourceTracker resources={character.resources} onChange={handleResourcesChange} />
        )}
        {tab === 'features' && <AbilitiesSection character={character} onUpdate={onUpdate} />}
        {tab === 'background' && (
          <BackgroundSection background={character.background} onChange={handleBackgroundChange} />
        )}
      </div>
    </div>
  )
}
