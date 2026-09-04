import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Ability, Character, CombatAction, Spell } from '../types'
import { fmtMod } from '../lib/dnd'
import { DetailCard } from './DetailCard'

const ACTION_CATEGORY_LABEL: Record<string, string> = {
  attack: 'Attacks', action: 'Actions', bonus_action: 'Bonus Actions', reaction: 'Reactions', other: 'Other'
}
const ACTION_CATEGORY_ORDER = ['attack', 'action', 'bonus_action', 'reaction', 'other']

const RECHARGE_LABEL: Record<string, string> = {
  short_rest: 'Short Rest', long_rest: 'Long Rest', dawn: 'Dawn', unlimited: 'Unlimited'
}

const ABILITY_CATEGORY_LABEL: Record<string, string> = {
  class_feature: 'Class Feature', species_trait: 'Species Trait', feat: 'Feat', other: 'Other'
}

function levelHeading(level: number): string {
  if (level === 0) return 'Cantrips'
  const suffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th'
  return `${level}${suffix} Level`
}

function levelLabel(level: number): string {
  return level === 0 ? 'Cantrip' : levelHeading(level)
}

function formatHitDc(kind: string, value: number | null): string {
  if (kind === 'attack_roll') return value != null ? fmtMod(value) : '—'
  if (kind === 'save_dc') return value != null ? `DC ${value}` : '—'
  return '—'
}

type OpenCard =
  | { kind: 'action'; item: CombatAction }
  | { kind: 'spell'; item: Spell }
  | { kind: 'ability'; item: Ability }
  | null

// A compact, everything-on-one-screen reference for the table — no
// clicking into edit screens to remember what an attack, spell, or feature
// does mid-session. Each row is a one-line summary; click it for the full
// entry in a DetailCard instead of always showing every description at
// once, which gets unreadably long past a handful of spells.
export function PlayModeSection({ character }: { character: Character }) {
  const [openCard, setOpenCard] = useState<OpenCard>(null)

  const actionsByCategory = ACTION_CATEGORY_ORDER
    .map((cat) => ({ cat, items: character.actions.filter((a) => a.category === cat) }))
    .filter((g) => g.items.length > 0)

  const spellLevels = Array.from(new Set(character.spells.map((s) => s.level))).sort((a, b) => a - b)

  const hasProficiencies =
    character.languages.length > 0 ||
    character.armor_proficiencies.length > 0 ||
    character.weapon_proficiencies.length > 0 ||
    character.tool_proficiencies.length > 0

  return (
    <div className="space-y-6">
      {character.actions.length === 0 && character.spells.length === 0 && character.abilities.length === 0 && (
        <p className="text-xs text-slate-600 text-center py-6">
          Nothing to show yet — add actions, spells, or features in their own tabs and they'll appear here.
        </p>
      )}

      {actionsByCategory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Actions</h3>
          {actionsByCategory.map((g) => (
            <div key={g.cat}>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-1.5">
                {ACTION_CATEGORY_LABEL[g.cat]}
              </p>
              <div className="space-y-1">
                {g.items.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setOpenCard({ kind: 'action', item: a })}
                    className="w-full flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors text-xs text-left row-interactive"
                  >
                    <span className="text-slate-200 font-medium">{a.name}</span>
                    {a.weapon_type && <span className="text-slate-600">· {a.weapon_type}</span>}
                    {a.range && <span className="text-slate-500">{a.range}</span>}
                    {a.attack_kind !== 'none' && (
                      <span className="text-amber-300 font-medium">{formatHitDc(a.attack_kind, a.hit_dc_value)}</span>
                    )}
                    {a.damage && (
                      <span className="text-slate-300">{a.damage}{a.damage_type && ` ${a.damage_type}`}</span>
                    )}
                    {a.max_uses != null && (
                      <span className="text-slate-600 ml-auto">{a.current_uses}/{a.max_uses} uses</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {character.spells.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Spells</h3>
          {spellLevels.map((lvl) => (
            <div key={lvl}>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-1.5">{levelHeading(lvl)}</p>
              <div className="space-y-1">
                {character.spells.filter((s) => s.level === lvl).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setOpenCard({ kind: 'spell', item: s })}
                    className="w-full flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors text-xs text-left row-interactive"
                  >
                    <span className="text-slate-200 font-medium">{s.name}</span>
                    {s.concentration && <Sparkles size={11} className="text-purple-400" />}
                    {s.prepared && <span className="text-emerald-400 text-[10px] uppercase tracking-wide">Prepared</span>}
                    {s.range && <span className="text-slate-500">{s.range}</span>}
                    {s.casting_time && <span className="text-slate-600">· {s.casting_time}</span>}
                    {s.damage && (
                      <span className="text-amber-300">{s.damage}{s.damage_type && ` ${s.damage_type}`}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {character.abilities.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-1.5">Features &amp; Traits</h3>
          {character.abilities.map((a) => (
            <button
              key={a.id}
              onClick={() => setOpenCard({ kind: 'ability', item: a })}
              className="w-full flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg bg-surface-overlay/50 hover:bg-surface-overlay transition-colors text-xs text-left row-interactive"
            >
              <span className="text-slate-200 font-medium">{a.name}</span>
              {a.max_uses != null && <span className="text-slate-600 ml-auto">{a.current_uses}/{a.max_uses} uses</span>}
            </button>
          ))}
        </div>
      )}

      {hasProficiencies && (
        <div className="space-y-2.5">
          <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Languages &amp; Proficiencies</h3>
          {character.languages.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-600 w-20 flex-shrink-0">Languages</span>
              <span className="text-slate-300">{character.languages.join(', ')}</span>
            </div>
          )}
          {character.armor_proficiencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-600 w-20 flex-shrink-0">Armor</span>
              <span className="text-slate-300">{character.armor_proficiencies.join(', ')}</span>
            </div>
          )}
          {character.weapon_proficiencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-600 w-20 flex-shrink-0">Weapons</span>
              <span className="text-slate-300">{character.weapon_proficiencies.join(', ')}</span>
            </div>
          )}
          {character.tool_proficiencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-600 w-20 flex-shrink-0">Tools</span>
              <span className="text-slate-300">{character.tool_proficiencies.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {openCard?.kind === 'action' && (
        <DetailCard
          onClose={() => setOpenCard(null)}
          title={openCard.item.name}
          categoryLabel={[ACTION_CATEGORY_LABEL[openCard.item.category], openCard.item.weapon_type].filter(Boolean).join(' · ')}
          stats={[
            { label: 'Range', value: openCard.item.range },
            { label: openCard.item.attack_kind === 'save_dc' ? 'Save DC' : 'To Hit', value: formatHitDc(openCard.item.attack_kind, openCard.item.hit_dc_value) },
            { label: 'Damage', value: [openCard.item.damage, openCard.item.damage_type].filter(Boolean).join(' ') },
          ]}
          notes={openCard.item.notes}
          description={openCard.item.description}
          usesLabel={
            openCard.item.max_uses != null
              ? `${openCard.item.current_uses}/${openCard.item.max_uses} uses — recharges on ${
                  openCard.item.recharge === 'custom' ? openCard.item.recharge_label || 'Custom' : RECHARGE_LABEL[openCard.item.recharge]
                }`
              : undefined
          }
        />
      )}

      {openCard?.kind === 'spell' && (
        <DetailCard
          onClose={() => setOpenCard(null)}
          title={openCard.item.name}
          categoryLabel={[levelLabel(openCard.item.level), openCard.item.school].filter(Boolean).join(' — ')}
          badges={[
            openCard.item.ritual && 'Ritual',
            openCard.item.concentration && 'Concentration',
            openCard.item.prepared && 'Prepared',
          ].filter(Boolean) as string[]}
          stats={[
            { label: 'Casting Time', value: openCard.item.casting_time },
            { label: 'Range', value: openCard.item.range },
            { label: 'Duration', value: openCard.item.duration },
            { label: 'Damage', value: [openCard.item.damage, openCard.item.damage_type].filter(Boolean).join(' ') },
          ]}
          description={openCard.item.description}
        />
      )}

      {openCard?.kind === 'ability' && (
        <DetailCard
          onClose={() => setOpenCard(null)}
          title={openCard.item.name}
          categoryLabel={ABILITY_CATEGORY_LABEL[openCard.item.category]}
          description={openCard.item.description}
          usesLabel={
            openCard.item.max_uses != null
              ? `${openCard.item.current_uses}/${openCard.item.max_uses} uses — recharges on ${
                  openCard.item.recharge === 'custom' ? openCard.item.recharge_label || 'Custom' : RECHARGE_LABEL[openCard.item.recharge]
                }`
              : undefined
          }
        />
      )}
    </div>
  )
}
