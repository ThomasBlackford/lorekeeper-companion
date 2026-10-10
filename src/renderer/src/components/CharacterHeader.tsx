import { useState, useEffect } from 'react'
import { Star, Camera, ArrowUpCircle, UserRound } from 'lucide-react'
import type { Character } from '../types'
import { NumberField } from './NumberField'
import { levelForXp, xpToNext, XP_FOR_LEVEL } from '../lib/dice'

type HeaderChanges = Partial<Pick<Character, 'name' | 'race' | 'class' | 'level' | 'alignment' | 'inspiration' | 'xp'>>

interface Props {
  character: Character
  onSave: (changes: HeaderChanges) => void
  onCharacter: (c: Character) => void
  onLevelUp: () => void
}

export function CharacterHeader({ character, onSave, onCharacter, onLevelUp }: Props) {
  const [name, setName] = useState(character.name)
  const [race, setRace] = useState(character.race)
  const [charClass, setCharClass] = useState(character.class)
  const [level, setLevel] = useState(String(character.level))
  const [alignment, setAlignment] = useState(character.alignment)

  useEffect(() => setName(character.name), [character.name])
  useEffect(() => setRace(character.race), [character.race])
  useEffect(() => setCharClass(character.class), [character.class])
  useEffect(() => setLevel(String(character.level)), [character.level])
  useEffect(() => setAlignment(character.alignment), [character.alignment])

  function commitLevel() {
    const val = parseInt(level)
    onSave({ level: isNaN(val) ? 1 : Math.max(1, val) })
  }

  async function changePortrait() {
    const c = await window.api.character.pickPortrait()
    if (c) onCharacter(c)
  }

  async function removePortrait() {
    onCharacter(await window.api.character.clearPortrait())
  }

  // XP vs the PHB table. The bar is progress within the current level, and a
  // level-up button appears the moment the total crosses the next threshold.
  const xpLevel = levelForXp(character.xp)
  const canLevel = xpLevel > character.level && character.level < 20
  const floor = XP_FOR_LEVEL[Math.min(character.level, 20) - 1] ?? 0
  const ceil = xpToNext(character.level)
  const pct = ceil == null ? 100 : Math.max(0, Math.min(100, ((character.xp - floor) / Math.max(1, ceil - floor)) * 100))

  return (
    <div className="text-center pt-2 space-y-3">
      <div className="flex justify-center">
        <div className="relative group">
          <button
            onClick={changePortrait}
            title="Choose a portrait"
            className="w-24 h-24 rounded-full overflow-hidden border-2 border-border group-hover:border-amber-500/60 bg-surface-overlay flex items-center justify-center transition-colors"
          >
            {character.portrait_path ? (
              <img src={`file:///${character.portrait_path.replace(/\\/g, '/')}`} alt="" className="w-full h-full object-cover" draggable={false} />
            ) : (
              <UserRound size={38} className="text-slate-700" />
            )}
            <span className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={18} className="text-white" />
            </span>
          </button>
          {character.portrait_path && (
            <button
              onClick={removePortrait}
              title="Remove portrait"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 text-[9px] uppercase tracking-wider bg-black text-slate-500 hover:text-white border border-border opacity-0 group-hover:opacity-100 transition-opacity"
            >
              remove
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          className="w-full text-center bg-transparent font-display text-2xl font-semibold text-white
                     focus:outline-none focus:bg-surface-overlay py-1 transition-colors tracking-wide"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onSave({ name })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="Character Name"
        />
        <button
          onClick={() => onSave({ inspiration: !character.inspiration })}
          title={character.inspiration ? 'Inspired (click to use it)' : 'No inspiration — click to grant'}
          className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
            character.inspiration ? 'text-amber-300' : 'text-slate-700 hover:text-slate-500'
          }`}
        >
          <Star size={16} fill={character.inspiration ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
        <input
          className="text-center bg-transparent text-slate-300 focus:outline-none focus:bg-surface-overlay py-1 px-2 w-28 transition-colors"
          value={race}
          onChange={(e) => setRace(e.target.value)}
          onBlur={() => onSave({ race })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="Race"
        />
        <span className="text-slate-700">·</span>
        <input
          className="text-center bg-transparent text-slate-300 focus:outline-none focus:bg-surface-overlay py-1 px-2 w-28 transition-colors"
          value={charClass}
          onChange={(e) => setCharClass(e.target.value)}
          onBlur={() => onSave({ class: charClass })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="Class"
        />
        <span className="text-slate-700">·</span>
        <div className="flex items-center gap-1 text-slate-300">
          <span className="text-slate-500 text-xs">Lv</span>
          <input
            className="w-8 text-center bg-transparent focus:outline-none focus:bg-surface-overlay py-1 transition-colors"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            onBlur={commitLevel}
            onKeyDown={(e) => e.key === 'Enter' && commitLevel()}
          />
        </div>
      </div>

      <input
        className="text-center bg-transparent text-xs text-amber-400/70 tracking-wide
                   focus:outline-none focus:bg-surface-overlay py-1 px-2 transition-colors"
        value={alignment}
        onChange={(e) => setAlignment(e.target.value)}
        onBlur={() => onSave({ alignment })}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder="Alignment (e.g. Chaotic Good)"
      />

      <div className="pt-1">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
          <span>Experience</span>
          <span className="flex items-center gap-1 normal-case tracking-normal">
            <NumberField
              className="w-16 text-right bg-transparent text-slate-200 focus:outline-none focus:bg-surface-overlay px-1"
              value={character.xp}
              min={0}
              onCommit={(v) => onSave({ xp: v })}
              title="Total XP"
            />
            {ceil != null && <span className="text-slate-600">/ {ceil}</span>}
          </span>
        </div>
        <div className="h-1.5 bg-surface-overlay overflow-hidden">
          <div className="h-full transition-[width]" style={{ width: `${pct}%`, background: 'var(--gradient-brand)' }} />
        </div>
        {canLevel && (
          <button
            onClick={onLevelUp}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs uppercase tracking-widest border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/15 transition-colors animate-pulse"
          >
            <ArrowUpCircle size={13} /> Level up to {character.level + 1}
          </button>
        )}
      </div>
    </div>
  )
}
