// Shared 5E rules math — ability modifiers, proficiency bonus, skill/save
// formulas, and the reference tables (skills, spellcasting classes,
// proficiency presets). Centralized here so every component that needs a
// modifier or a bonus computes it the same way.
import type { AbilityScoreKey, Character, SkillId, SkillProficiency } from '../types'

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

// Standard array: +2 at levels 1-4, +3 at 5-8, +4 at 9-12, +5 at 13-16, +6 at 17-20.
export function proficiencyBonusForLevel(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4)
}

export const ABILITY_ORDER: AbilityScoreKey[] = [
  'str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score'
]

export const ABILITY_SHORT: Record<AbilityScoreKey, string> = {
  str_score: 'STR', dex_score: 'DEX', con_score: 'CON',
  int_score: 'INT', wis_score: 'WIS', cha_score: 'CHA'
}

export const ABILITY_LABELS: Record<AbilityScoreKey, string> = {
  str_score: 'Strength', dex_score: 'Dexterity', con_score: 'Constitution',
  int_score: 'Intelligence', wis_score: 'Wisdom', cha_score: 'Charisma'
}

export interface SkillDef {
  key: SkillId
  label: string
  ability: AbilityScoreKey
}

// The 18 standard skills with their fixed governing ability, in the
// alphabetical order most character sheets (and D&D Beyond) use.
export const SKILLS: SkillDef[] = [
  { key: 'acrobatics', label: 'Acrobatics', ability: 'dex_score' },
  { key: 'animal_handling', label: 'Animal Handling', ability: 'wis_score' },
  { key: 'arcana', label: 'Arcana', ability: 'int_score' },
  { key: 'athletics', label: 'Athletics', ability: 'str_score' },
  { key: 'deception', label: 'Deception', ability: 'cha_score' },
  { key: 'history', label: 'History', ability: 'int_score' },
  { key: 'insight', label: 'Insight', ability: 'wis_score' },
  { key: 'intimidation', label: 'Intimidation', ability: 'cha_score' },
  { key: 'investigation', label: 'Investigation', ability: 'int_score' },
  { key: 'medicine', label: 'Medicine', ability: 'wis_score' },
  { key: 'nature', label: 'Nature', ability: 'int_score' },
  { key: 'perception', label: 'Perception', ability: 'wis_score' },
  { key: 'performance', label: 'Performance', ability: 'cha_score' },
  { key: 'persuasion', label: 'Persuasion', ability: 'cha_score' },
  { key: 'religion', label: 'Religion', ability: 'int_score' },
  { key: 'sleight_of_hand', label: 'Sleight of Hand', ability: 'dex_score' },
  { key: 'stealth', label: 'Stealth', ability: 'dex_score' },
  { key: 'survival', label: 'Survival', ability: 'wis_score' }
]

type ScoreSource = Pick<Character, AbilityScoreKey | 'proficiency_bonus'>

export function skillModifier(
  character: ScoreSource,
  skill: SkillDef,
  proficiency: SkillProficiency
): number {
  const base = abilityMod(character[skill.ability])
  const pb = character.proficiency_bonus ?? 0
  const mult = proficiency === 'expertise' ? 2 : proficiency === 'proficient' ? 1 : 0
  return base + pb * mult
}

export function saveModifier(character: ScoreSource, ability: AbilityScoreKey, proficient: boolean): number {
  return abilityMod(character[ability]) + (proficient ? character.proficiency_bonus ?? 0 : 0)
}

// Every class in 5E that casts spells, mapped to the ability it casts from —
// lets the player pick "Warlock" instead of having to already know that
// means Charisma. Eldritch Knights/Arcane Tricksters always use Intelligence
// regardless of base class, so Wizard's entry covers that case too.
export const SPELLCASTING_CLASS_OPTIONS: { label: string; ability: AbilityScoreKey }[] = [
  { label: 'Artificer', ability: 'int_score' },
  { label: 'Wizard', ability: 'int_score' },
  { label: 'Cleric', ability: 'wis_score' },
  { label: 'Druid', ability: 'wis_score' },
  { label: 'Ranger', ability: 'wis_score' },
  { label: 'Bard', ability: 'cha_score' },
  { label: 'Paladin', ability: 'cha_score' },
  { label: 'Sorcerer', ability: 'cha_score' },
  { label: 'Warlock', ability: 'cha_score' }
]

// 5E exhaustion is cumulative and escalating, not a single on/off condition
// — index 0 is "none," each level below applies in addition to the ones
// above it.
export const EXHAUSTION_EFFECTS = [
  'None',
  'Disadvantage on ability checks',
  'Speed halved',
  'Disadvantage on attack rolls and saving throws',
  'Hit point maximum halved',
  'Speed reduced to 0',
  'Death'
]

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

export const ARMOR_PROFICIENCY_OPTIONS = ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields']
export const WEAPON_PROFICIENCY_PRESETS = ['Simple Weapons', 'Martial Weapons']
export const COMMON_LANGUAGES = [
  'Common', 'Common Sign Language', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish',
  'Goblin', 'Halfling', 'Orc', 'Abyssal', 'Celestial', 'Deep Speech',
  'Draconic', 'Infernal', 'Primordial', 'Sylvan', 'Undercommon'
]
