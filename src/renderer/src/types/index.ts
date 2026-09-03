export interface Resource {
  id: string
  name: string
  current: number
  max: number
  color: string
}

export type RechargeType = 'short_rest' | 'long_rest' | 'dawn' | 'unlimited' | 'custom'

export interface Spell {
  id: string
  name: string
  level: number // 0 = cantrip, 1-9 otherwise
  school: string
  casting_time: string
  range: string
  duration: string
  ritual: boolean
  concentration: boolean
  prepared: boolean
  description: string
  sort_order: number
}

export interface SpellSlot {
  level: number // 1-9
  max: number
  current: number
}

// Matches D&D Beyond's Features & Traits sub-tabs.
export type AbilityCategory = 'class_feature' | 'species_trait' | 'feat' | 'other'

export interface Ability {
  id: string
  name: string
  category: AbilityCategory
  description: string
  max_uses: number | null // null = passive / no counter
  current_uses: number | null
  recharge: RechargeType
  recharge_label: string // free text, used when recharge === 'custom'
  sort_order: number
}

export type AbilityScoreKey =
  | 'str_score' | 'dex_score' | 'con_score' | 'int_score' | 'wis_score' | 'cha_score'

// The 18 standard 5E skills. Each is permanently tied to one ability score
// per the rules, so that mapping lives with the skill list in lib/dnd.ts
// rather than being stored per-character.
export type SkillId =
  | 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics' | 'deception'
  | 'history' | 'insight' | 'intimidation' | 'investigation' | 'medicine'
  | 'nature' | 'perception' | 'performance' | 'persuasion' | 'religion'
  | 'sleight_of_hand' | 'stealth' | 'survival'

// Expertise doubles the proficiency bonus instead of just adding it once —
// distinct enough from a plain boolean that it needs its own tri-state.
export type SkillProficiency = 'none' | 'proficient' | 'expertise'

export type SkillProficiencies = Partial<Record<SkillId, SkillProficiency>>

// Matches D&D Beyond's Actions-tab sub-tabs, so filtering feels familiar.
export type ActionCategory = 'attack' | 'action' | 'bonus_action' | 'reaction' | 'other'

// Whether the Hit/DC field is an attack-roll bonus (+N to hit) or a save DC
// the target rolls against — "none" covers things with no roll at all.
export type AttackKind = 'attack_roll' | 'save_dc' | 'none'

export interface CombatAction {
  id: string
  name: string
  category: ActionCategory
  weapon_type: string // subtitle, e.g. "Ranged Weapon", "Melee Attack"
  range: string
  attack_kind: AttackKind
  hit_dc_value: number | null
  damage: string
  damage_type: string
  notes: string // short reference, e.g. weapon properties
  description: string // the "in-depth effects" write-up
  max_uses: number | null // null = at will / no counter
  current_uses: number | null
  recharge: RechargeType
  recharge_label: string
  sort_order: number
}

export type DefenseType = 'resistance' | 'immunity' | 'vulnerability'

export interface Defense {
  id: string
  type: DefenseType
  label: string // e.g. "Fire", "Poison", "Bludgeoning from nonmagical attacks"
}

// Same 15 conditions the DM app tracks in combat, kept identical so the
// two apps read as one system.
export type Condition =
  'Blinded' | 'Charmed' | 'Deafened' | 'Exhausted' | 'Frightened' |
  'Grappled' | 'Incapacitated' | 'Invisible' | 'Paralyzed' | 'Petrified' |
  'Poisoned' | 'Prone' | 'Restrained' | 'Stunned' | 'Unconscious'

export type InventoryCategory = 'equipment' | 'backpack' | 'attunement' | 'other'

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  weight: number // lb, per unit
  quantity: number
  cost: number // gp
  notes: string
  equipped: boolean
  sort_order: number
}

// Freeform roleplay/identity info — one editable blob rather than a table,
// same pattern as resources/defenses/conditions: nothing here needs to be
// queried on its own, it's always read and written as a whole.
export interface Background {
  title: string
  description: string
  gender: string
  eyes: string
  size: string
  height: string
  faith: string
  hair: string
  skin: string
  age: string
  weight: string // descriptive (e.g. "180 lb") — distinct from inventory item weight
  personality_traits: string
  ideals: string
  bonds: string
  flaws: string
  appearance: string
}

export const EMPTY_BACKGROUND: Background = {
  title: '', description: '', gender: '', eyes: '', size: '', height: '',
  faith: '', hair: '', skin: '', age: '', weight: '',
  personality_traits: '', ideals: '', bonds: '', flaws: '', appearance: ''
}

export interface Character {
  id: string
  name: string
  race: string
  class: string
  level: number
  alignment: string
  ac: number | null
  proficiency_bonus: number | null
  speed: number | null
  initiative: number | null
  initiative_bonus: number
  str_score: number
  dex_score: number
  con_score: number
  int_score: number
  wis_score: number
  cha_score: number
  hp_current: number | null
  hp_max: number | null
  hp_temp: number
  death_save_successes: number
  death_save_failures: number
  hit_dice_total: number | null
  hit_dice_current: number | null
  hit_die_size: string // 'd6' | 'd8' | 'd10' | 'd12', free text so homebrew isn't blocked
  inspiration: boolean
  concentration_spell_name: string // '' = not concentrating on anything
  exhaustion_level: number // 0-6, per 5E's escalating exhaustion levels
  spellcasting_ability: AbilityScoreKey | null
  spellcasting_class: string
  gold: number
  notes: string
  background: Background
  dm_server_address: string
  resources: Resource[]
  defenses: Defense[]
  conditions: Condition[]
  skills: SkillProficiencies
  save_proficiencies: AbilityScoreKey[]
  armor_proficiencies: string[]
  weapon_proficiencies: string[]
  tool_proficiencies: string[]
  languages: string[]
  spells: Spell[]
  spellSlots: SpellSlot[]
  abilities: Ability[]
  actions: CombatAction[]
  inventory: InventoryItem[]
}

export interface SyncStatus {
  connected: boolean
  address: string | null
  error: string | null
}

export interface PartyChatMessage {
  from: string
  text: string
  at: number
}

export interface DmReply {
  text: string
  at: number
}
