import { ipcMain } from 'electron'
import { getDb } from '../db'
import { v4 as uuidv4 } from 'uuid'
import { sendSnapshot, onConnected } from '../sync'

const CHAR_ID = 'local'

interface CharacterRow {
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
  hit_die_size: string
  inspiration: number
  concentration_spell_name: string
  exhaustion_level: number
  spellcasting_ability: string | null
  spellcasting_class: string
  gold: number
  notes: string
  background: string
  dm_server_address: string
  resources: string
  defenses: string
  conditions: string
  skills: string
  save_proficiencies: string
  armor_proficiencies: string
  weapon_proficiencies: string
  tool_proficiencies: string
  languages: string
}
interface SpellRow {
  id: string
  name: string
  level: number
  school: string
  casting_time: string
  range: string
  duration: string
  ritual: number
  concentration: number
  prepared: number
  description: string
  damage: string
  damage_type: string
  attack_kind: string
  sort_order: number
}
interface SlotRow { level: number; max: number; current: number }
interface AbilityRow {
  id: string
  name: string
  category: string
  description: string
  max_uses: number | null
  current_uses: number | null
  recharge: string
  recharge_label: string
  sort_order: number
}
interface ActionRow {
  id: string
  name: string
  category: string
  weapon_type: string
  range: string
  attack_kind: string
  hit_dc_value: number | null
  damage: string
  damage_type: string
  notes: string
  description: string
  max_uses: number | null
  current_uses: number | null
  recharge: string
  recharge_label: string
  sort_order: number
  source_type: string | null
  source_id: string | null
}
interface InventoryRow {
  id: string
  name: string
  category: string
  weight: number
  quantity: number
  cost: number
  notes: string
  equipped: number
  sort_order: number
  damage: string
  damage_type: string
  range: string
}

function buildCharacter(db: ReturnType<typeof getDb>) {
  const row = db.prepare('SELECT * FROM character WHERE id = ?').get(CHAR_ID) as CharacterRow
  const spellRows = db
    .prepare('SELECT * FROM spells ORDER BY level ASC, sort_order ASC')
    .all() as SpellRow[]
  const slotRows = db.prepare('SELECT * FROM spell_slots ORDER BY level ASC').all() as SlotRow[]
  const abilityRows = db
    .prepare('SELECT * FROM abilities ORDER BY sort_order ASC')
    .all() as AbilityRow[]
  const actionRows = db
    .prepare('SELECT * FROM actions ORDER BY sort_order ASC')
    .all() as ActionRow[]
  const inventoryRows = db
    .prepare('SELECT * FROM inventory ORDER BY sort_order ASC')
    .all() as InventoryRow[]

  return {
    id: row.id,
    name: row.name,
    race: row.race,
    class: row.class,
    level: row.level,
    alignment: row.alignment,
    ac: row.ac,
    proficiency_bonus: row.proficiency_bonus,
    speed: row.speed,
    initiative: row.initiative,
    initiative_bonus: row.initiative_bonus,
    str_score: row.str_score,
    dex_score: row.dex_score,
    con_score: row.con_score,
    int_score: row.int_score,
    wis_score: row.wis_score,
    cha_score: row.cha_score,
    hp_current: row.hp_current,
    hp_max: row.hp_max,
    hp_temp: row.hp_temp,
    death_save_successes: row.death_save_successes,
    death_save_failures: row.death_save_failures,
    hit_dice_total: row.hit_dice_total,
    hit_dice_current: row.hit_dice_current,
    hit_die_size: row.hit_die_size,
    inspiration: !!row.inspiration,
    concentration_spell_name: row.concentration_spell_name,
    exhaustion_level: row.exhaustion_level,
    spellcasting_ability: row.spellcasting_ability,
    spellcasting_class: row.spellcasting_class,
    gold: row.gold,
    notes: row.notes,
    background: JSON.parse(row.background || '{}'),
    dm_server_address: row.dm_server_address,
    resources: JSON.parse(row.resources || '[]'),
    defenses: JSON.parse(row.defenses || '[]'),
    conditions: JSON.parse(row.conditions || '[]'),
    skills: JSON.parse(row.skills || '{}'),
    save_proficiencies: JSON.parse(row.save_proficiencies || '[]'),
    armor_proficiencies: JSON.parse(row.armor_proficiencies || '[]'),
    weapon_proficiencies: JSON.parse(row.weapon_proficiencies || '[]'),
    tool_proficiencies: JSON.parse(row.tool_proficiencies || '[]'),
    languages: JSON.parse(row.languages || '[]'),
    spells: spellRows.map((s) => ({
      ...s,
      ritual: !!s.ritual,
      concentration: !!s.concentration,
      prepared: !!s.prepared
    })),
    spellSlots: slotRows,
    abilities: abilityRows,
    actions: actionRows,
    inventory: inventoryRows.map((i) => ({ ...i, equipped: !!i.equipped }))
  }
}

// Every mutating handler ends by returning the freshly-built character to
// the renderer — this wrapper piggybacks on that same point to also push a
// live snapshot to the DM app (a no-op if not connected), so nothing needs
// its own separate "sync now" call scattered through each handler below.
function buildCharacterAndSync(db: ReturnType<typeof getDb>) {
  const character = buildCharacter(db)
  sendSnapshot({
    name: character.name,
    race: character.race,
    class: character.class,
    level: character.level,
    ac: character.ac,
    initiative: character.initiative,
    hp_current: character.hp_current,
    hp_max: character.hp_max,
    hp_temp: character.hp_temp,
    inspiration: character.inspiration,
    spellSlots: character.spellSlots,
    resources: character.resources,
    conditions: character.conditions
  })
  return character
}

// Spell attack bonus / save DC, computed the same way SpellcastingStats.tsx
// does in the renderer — duplicated here (rather than shared) since it's
// three lines of arithmetic and pulling renderer code into the main
// process isn't worth it for that.
function computeSpellStats(db: ReturnType<typeof getDb>): { attackBonus: number; saveDc: number } | null {
  const char = db.prepare("SELECT * FROM character WHERE id='local'").get() as CharacterRow
  if (!char.spellcasting_ability) return null
  const abilityScore = char[char.spellcasting_ability as keyof CharacterRow] as number
  const abilityMod = Math.floor((abilityScore - 10) / 2)
  const pb = char.proficiency_bonus ?? 0
  return { attackBonus: abilityMod + pb, saveDc: 8 + abilityMod + pb }
}

// Keeps a spell or weapon's damage in sync with a linked row in `actions`,
// so the player never has to retype the same attack a second time — this
// is what the damage field on Spells/Inventory is for. Only ever touches
// the one action whose source_type/source_id matches; every hand-created
// action has both NULL and is invisible to this function.
function syncSourceAction(
  db: ReturnType<typeof getDb>,
  sourceType: 'spell' | 'item',
  sourceId: string,
  data: { name: string; damage: string; damageType: string; range?: string; attackKind?: string; hitDcValue?: number | null }
): void {
  const existing = db
    .prepare('SELECT * FROM actions WHERE source_type=? AND source_id=?')
    .get(sourceType, sourceId) as ActionRow | undefined

  if (!data.damage.trim()) {
    // Damage was cleared — the generated action no longer represents
    // anything, so remove it rather than leave a stale "0 damage" entry.
    if (existing) db.prepare('DELETE FROM actions WHERE id=?').run(existing.id)
    return
  }

  if (existing) {
    // Name/damage/range always mirror the source. attack_kind/hit_dc_value
    // are only overwritten when the caller passes them (spells recompute
    // these every save) — for weapons they're left alone so a to-hit bonus
    // the player typed into the generated action isn't wiped out by a
    // later edit to the item's weight or notes.
    db.prepare('UPDATE actions SET name=?, damage=?, damage_type=?, range=? WHERE id=?').run(
      data.name, data.damage, data.damageType, data.range ?? existing.range, existing.id
    )
    if (data.attackKind) {
      db.prepare('UPDATE actions SET attack_kind=?, hit_dc_value=? WHERE id=?').run(
        data.attackKind, data.hitDcValue ?? null, existing.id
      )
    }
  } else {
    const count = (db.prepare('SELECT COUNT(*) as c FROM actions').get() as { c: number }).c
    db.prepare(
      `INSERT INTO actions (id, name, category, weapon_type, range, attack_kind, hit_dc_value, damage, damage_type, notes, description, max_uses, current_uses, recharge, recharge_label, sort_order, source_type, source_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      uuidv4(),
      data.name,
      'attack',
      sourceType === 'spell' ? 'Spell' : 'Weapon',
      data.range ?? '',
      data.attackKind ?? 'attack_roll',
      data.hitDcValue ?? null,
      data.damage,
      data.damageType,
      '',
      '',
      null,
      null,
      'unlimited',
      '',
      count,
      sourceType,
      sourceId
    )
  }
}

// Thin wrapper over syncSourceAction for spells specifically — computes the
// current spell attack bonus / save DC so the generated action's hit/DC
// number stays correct as proficiency bonus and ability scores change,
// rather than freezing whatever it was the moment the spell was first typed in.
function syncSpellAction(
  db: ReturnType<typeof getDb>,
  spellId: string,
  name: string,
  damage: string,
  damageType: string,
  attackKind: string
): void {
  const stats = computeSpellStats(db)
  const hitDcValue =
    !stats || attackKind === 'none' ? null : attackKind === 'save_dc' ? stats.saveDc : stats.attackBonus
  syncSourceAction(db, 'spell', spellId, { name, damage, damageType, attackKind, hitDcValue })
}

export function registerCharacterHandlers(): void {
  // The moment the socket opens (fresh connect or the silent reconnect on
  // launch), push a snapshot so the DM sees this player immediately rather
  // than waiting for the next sheet edit.
  onConnected(() => buildCharacterAndSync(getDb()))

  ipcMain.handle('character:get', () => buildCharacter(getDb()))

  ipcMain.handle('character:save', (_e, changes: Record<string, unknown>) => {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM character WHERE id = ?').get(CHAR_ID) as CharacterRow

    const name = 'name' in changes ? (changes.name as string) : existing.name
    const race = 'race' in changes ? (changes.race as string) : existing.race
    const charClass = 'class' in changes ? (changes.class as string) : existing.class
    const level = 'level' in changes ? (changes.level as number) : existing.level
    const alignment = 'alignment' in changes ? (changes.alignment as string) : existing.alignment
    const ac = 'ac' in changes ? (changes.ac as number | null) : existing.ac
    const proficiencyBonus =
      'proficiency_bonus' in changes ? (changes.proficiency_bonus as number | null) : existing.proficiency_bonus
    const speed = 'speed' in changes ? (changes.speed as number | null) : existing.speed
    const initiative = 'initiative' in changes ? (changes.initiative as number | null) : existing.initiative
    const initiativeBonus =
      'initiative_bonus' in changes ? (changes.initiative_bonus as number) : existing.initiative_bonus
    const strScore = 'str_score' in changes ? (changes.str_score as number) : existing.str_score
    const dexScore = 'dex_score' in changes ? (changes.dex_score as number) : existing.dex_score
    const conScore = 'con_score' in changes ? (changes.con_score as number) : existing.con_score
    const intScore = 'int_score' in changes ? (changes.int_score as number) : existing.int_score
    const wisScore = 'wis_score' in changes ? (changes.wis_score as number) : existing.wis_score
    const chaScore = 'cha_score' in changes ? (changes.cha_score as number) : existing.cha_score
    const hpCurrent = 'hp_current' in changes ? (changes.hp_current as number | null) : existing.hp_current
    const hpMax = 'hp_max' in changes ? (changes.hp_max as number | null) : existing.hp_max
    const hpTemp = 'hp_temp' in changes ? (changes.hp_temp as number) : existing.hp_temp
    const hitDiceTotal =
      'hit_dice_total' in changes ? (changes.hit_dice_total as number | null) : existing.hit_dice_total
    const hitDiceCurrent =
      'hit_dice_current' in changes ? (changes.hit_dice_current as number | null) : existing.hit_dice_current
    const hitDieSize = 'hit_die_size' in changes ? (changes.hit_die_size as string) : existing.hit_die_size
    const inspiration =
      'inspiration' in changes ? (changes.inspiration ? 1 : 0) : existing.inspiration
    const concentrationSpellName =
      'concentration_spell_name' in changes
        ? (changes.concentration_spell_name as string)
        : existing.concentration_spell_name
    const exhaustionLevel =
      'exhaustion_level' in changes ? (changes.exhaustion_level as number) : existing.exhaustion_level

    // Dropping to 0 (down) or coming back above 0 (healed/stabilized) both
    // start a fresh death-save sequence — explicit changes to the counters
    // themselves (the death-save buttons) still take priority over this.
    let deathSaveSuccesses = existing.death_save_successes
    let deathSaveFailures = existing.death_save_failures
    if ('hp_current' in changes) {
      const wasUp = existing.hp_current == null || existing.hp_current > 0
      const isUp = hpCurrent != null && hpCurrent > 0
      if (isUp || (!isUp && wasUp)) {
        deathSaveSuccesses = 0
        deathSaveFailures = 0
      }
    }
    if ('death_save_successes' in changes) deathSaveSuccesses = changes.death_save_successes as number
    if ('death_save_failures' in changes) deathSaveFailures = changes.death_save_failures as number
    const spellcastingAbility =
      'spellcasting_ability' in changes
        ? (changes.spellcasting_ability as string | null)
        : existing.spellcasting_ability
    const spellcastingClass =
      'spellcasting_class' in changes
        ? (changes.spellcasting_class as string)
        : existing.spellcasting_class
    const gold = 'gold' in changes ? (changes.gold as number) : existing.gold
    const notes = 'notes' in changes ? (changes.notes as string) : existing.notes
    const dmServerAddress =
      'dm_server_address' in changes ? (changes.dm_server_address as string) : existing.dm_server_address

    db.prepare(
      `UPDATE character SET name=?, race=?, class=?, level=?, alignment=?, ac=?, proficiency_bonus=?, speed=?, initiative=?, initiative_bonus=?,
       str_score=?, dex_score=?, con_score=?, int_score=?, wis_score=?, cha_score=?, hp_current=?, hp_max=?, hp_temp=?,
       death_save_successes=?, death_save_failures=?, hit_dice_total=?, hit_dice_current=?, hit_die_size=?,
       inspiration=?, concentration_spell_name=?, exhaustion_level=?,
       spellcasting_ability=?, spellcasting_class=?, gold=?, notes=?, dm_server_address=?
       WHERE id=?`
    ).run(
      name, race, charClass, level, alignment, ac, proficiencyBonus, speed, initiative, initiativeBonus,
      strScore, dexScore, conScore, intScore, wisScore, chaScore, hpCurrent, hpMax, hpTemp,
      deathSaveSuccesses, deathSaveFailures, hitDiceTotal, hitDiceCurrent, hitDieSize,
      inspiration, concentrationSpellName, exhaustionLevel,
      spellcastingAbility, spellcastingClass, gold, notes, dmServerAddress,
      CHAR_ID
    )
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('character:updateSkills', (_e, skills: unknown) => {
    const db = getDb()
    db.prepare('UPDATE character SET skills=? WHERE id=?').run(JSON.stringify(skills), CHAR_ID)
    return buildCharacterAndSync(db)
  })

  // One handler for the whole Proficiencies & Languages panel — those five
  // lists are edited together on one screen, same reasoning as background
  // being a single blob rather than five separate calls.
  ipcMain.handle('character:updateProficiencies', (_e, changes: Record<string, unknown>) => {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM character WHERE id = ?').get(CHAR_ID) as CharacterRow
    const saveProficiencies =
      'save_proficiencies' in changes ? JSON.stringify(changes.save_proficiencies) : existing.save_proficiencies
    const armorProficiencies =
      'armor_proficiencies' in changes ? JSON.stringify(changes.armor_proficiencies) : existing.armor_proficiencies
    const weaponProficiencies =
      'weapon_proficiencies' in changes ? JSON.stringify(changes.weapon_proficiencies) : existing.weapon_proficiencies
    const toolProficiencies =
      'tool_proficiencies' in changes ? JSON.stringify(changes.tool_proficiencies) : existing.tool_proficiencies
    const languages = 'languages' in changes ? JSON.stringify(changes.languages) : existing.languages
    db.prepare(
      `UPDATE character SET save_proficiencies=?, armor_proficiencies=?, weapon_proficiencies=?, tool_proficiencies=?, languages=? WHERE id=?`
    ).run(saveProficiencies, armorProficiencies, weaponProficiencies, toolProficiencies, languages, CHAR_ID)
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('character:updateResources', (_e, resources: unknown[]) => {
    const db = getDb()
    db.prepare('UPDATE character SET resources=? WHERE id=?').run(JSON.stringify(resources), CHAR_ID)
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('character:updateBackground', (_e, background: unknown) => {
    const db = getDb()
    db.prepare('UPDATE character SET background=? WHERE id=?').run(JSON.stringify(background), CHAR_ID)
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('character:updateDefenses', (_e, defenses: unknown[]) => {
    const db = getDb()
    db.prepare('UPDATE character SET defenses=? WHERE id=?').run(JSON.stringify(defenses), CHAR_ID)
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('character:updateConditions', (_e, conditions: unknown[]) => {
    const db = getDb()
    db.prepare('UPDATE character SET conditions=? WHERE id=?').run(JSON.stringify(conditions), CHAR_ID)
    return buildCharacterAndSync(db)
  })

  // ── Spells ──────────────────────────────────────────────────────────────

  ipcMain.handle('spells:add', (_e, data: Record<string, unknown>) => {
    const db = getDb()
    const id = uuidv4()
    const count = (db.prepare('SELECT COUNT(*) as c FROM spells').get() as { c: number }).c
    const damage = (data.damage as string) ?? ''
    const damageType = (data.damage_type as string) ?? ''
    const attackKind = (data.attack_kind as string) ?? 'attack_roll'
    db.prepare(
      `INSERT INTO spells (id, name, level, school, casting_time, range, duration, ritual, concentration, prepared, description, damage, damage_type, attack_kind, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      data.name,
      data.level ?? 0,
      data.school ?? '',
      data.casting_time ?? '',
      data.range ?? '',
      data.duration ?? '',
      data.ritual ? 1 : 0,
      data.concentration ? 1 : 0,
      data.prepared ? 1 : 0,
      data.description ?? '',
      damage,
      damageType,
      attackKind,
      count
    )
    syncSpellAction(db, id, data.name as string, damage, damageType, attackKind)
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('spells:update', (_e, id: string, changes: Record<string, unknown>) => {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM spells WHERE id=?').get(id) as SpellRow | undefined
    if (!existing) return buildCharacterAndSync(db)
    const merged = {
      name: changes.name ?? existing.name,
      level: changes.level ?? existing.level,
      school: changes.school ?? existing.school,
      casting_time: changes.casting_time ?? existing.casting_time,
      range: changes.range ?? existing.range,
      duration: changes.duration ?? existing.duration,
      ritual: 'ritual' in changes ? (changes.ritual ? 1 : 0) : existing.ritual,
      concentration: 'concentration' in changes ? (changes.concentration ? 1 : 0) : existing.concentration,
      prepared: 'prepared' in changes ? (changes.prepared ? 1 : 0) : existing.prepared,
      description: changes.description ?? existing.description,
      damage: 'damage' in changes ? (changes.damage as string) : existing.damage,
      damage_type: 'damage_type' in changes ? (changes.damage_type as string) : existing.damage_type,
      attack_kind: 'attack_kind' in changes ? (changes.attack_kind as string) : existing.attack_kind
    }
    db.prepare(
      `UPDATE spells SET name=?, level=?, school=?, casting_time=?, range=?, duration=?, ritual=?, concentration=?, prepared=?, description=?, damage=?, damage_type=?, attack_kind=? WHERE id=?`
    ).run(
      merged.name,
      merged.level,
      merged.school,
      merged.casting_time,
      merged.range,
      merged.duration,
      merged.ritual,
      merged.concentration,
      merged.prepared,
      merged.description,
      merged.damage,
      merged.damage_type,
      merged.attack_kind,
      id
    )
    syncSpellAction(db, id, merged.name as string, merged.damage, merged.damage_type, merged.attack_kind)
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('spells:remove', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM spells WHERE id=?').run(id)
    db.prepare("DELETE FROM actions WHERE source_type='spell' AND source_id=?").run(id)
    return buildCharacterAndSync(db)
  })

  // ── Spell slots ─────────────────────────────────────────────────────────

  ipcMain.handle(
    'spellSlots:update',
    (_e, level: number, changes: Partial<{ max: number; current: number }>) => {
      const db = getDb()
      const existing = db.prepare('SELECT * FROM spell_slots WHERE level=?').get(level) as
        | SlotRow
        | undefined
      const max = changes.max ?? existing?.max ?? 0
      const current = changes.current ?? existing?.current ?? 0
      db.prepare(
        'INSERT INTO spell_slots (level, max, current) VALUES (?,?,?) ON CONFLICT(level) DO UPDATE SET max=excluded.max, current=excluded.current'
      ).run(level, max, current)
      return buildCharacterAndSync(db)
    }
  )

  // ── Abilities ───────────────────────────────────────────────────────────

  ipcMain.handle('abilities:add', (_e, data: Record<string, unknown>) => {
    const db = getDb()
    const count = (db.prepare('SELECT COUNT(*) as c FROM abilities').get() as { c: number }).c
    const maxUses = data.max_uses == null ? null : Number(data.max_uses)
    db.prepare(
      `INSERT INTO abilities (id, name, category, description, max_uses, current_uses, recharge, recharge_label, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(
      uuidv4(),
      data.name,
      data.category ?? 'class_feature',
      data.description ?? '',
      maxUses,
      maxUses, // new abilities start with full uses available
      data.recharge ?? 'long_rest',
      data.recharge_label ?? '',
      count
    )
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('abilities:update', (_e, id: string, changes: Record<string, unknown>) => {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM abilities WHERE id=?').get(id) as AbilityRow | undefined
    if (!existing) return buildCharacterAndSync(db)
    const merged = {
      name: changes.name ?? existing.name,
      category: changes.category ?? existing.category,
      description: changes.description ?? existing.description,
      max_uses:
        'max_uses' in changes
          ? changes.max_uses == null
            ? null
            : Number(changes.max_uses)
          : existing.max_uses,
      current_uses:
        'current_uses' in changes
          ? changes.current_uses == null
            ? null
            : Number(changes.current_uses)
          : existing.current_uses,
      recharge: changes.recharge ?? existing.recharge,
      recharge_label: changes.recharge_label ?? existing.recharge_label
    }
    db.prepare(
      `UPDATE abilities SET name=?, category=?, description=?, max_uses=?, current_uses=?, recharge=?, recharge_label=? WHERE id=?`
    ).run(
      merged.name,
      merged.category,
      merged.description,
      merged.max_uses,
      merged.current_uses,
      merged.recharge,
      merged.recharge_label,
      id
    )
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('abilities:remove', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM abilities WHERE id=?').run(id)
    return buildCharacterAndSync(db)
  })

  // ── Actions ─────────────────────────────────────────────────────────────

  ipcMain.handle('actions:add', (_e, data: Record<string, unknown>) => {
    const db = getDb()
    const count = (db.prepare('SELECT COUNT(*) as c FROM actions').get() as { c: number }).c
    const maxUses = data.max_uses == null ? null : Number(data.max_uses)
    db.prepare(
      `INSERT INTO actions (id, name, category, weapon_type, range, attack_kind, hit_dc_value, damage, damage_type, notes, description, max_uses, current_uses, recharge, recharge_label, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      uuidv4(),
      data.name,
      data.category ?? 'action',
      data.weapon_type ?? '',
      data.range ?? '',
      data.attack_kind ?? 'attack_roll',
      data.hit_dc_value == null ? null : Number(data.hit_dc_value),
      data.damage ?? '',
      data.damage_type ?? '',
      data.notes ?? '',
      data.description ?? '',
      maxUses,
      maxUses, // new actions start with full uses available
      data.recharge ?? 'long_rest',
      data.recharge_label ?? '',
      count
    )
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('actions:update', (_e, id: string, changes: Record<string, unknown>) => {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM actions WHERE id=?').get(id) as ActionRow | undefined
    if (!existing) return buildCharacterAndSync(db)
    const merged = {
      name: changes.name ?? existing.name,
      category: changes.category ?? existing.category,
      weapon_type: changes.weapon_type ?? existing.weapon_type,
      range: changes.range ?? existing.range,
      attack_kind: changes.attack_kind ?? existing.attack_kind,
      hit_dc_value:
        'hit_dc_value' in changes
          ? changes.hit_dc_value == null
            ? null
            : Number(changes.hit_dc_value)
          : existing.hit_dc_value,
      damage: changes.damage ?? existing.damage,
      damage_type: changes.damage_type ?? existing.damage_type,
      notes: changes.notes ?? existing.notes,
      description: changes.description ?? existing.description,
      max_uses:
        'max_uses' in changes
          ? changes.max_uses == null
            ? null
            : Number(changes.max_uses)
          : existing.max_uses,
      current_uses:
        'current_uses' in changes
          ? changes.current_uses == null
            ? null
            : Number(changes.current_uses)
          : existing.current_uses,
      recharge: changes.recharge ?? existing.recharge,
      recharge_label: changes.recharge_label ?? existing.recharge_label
    }
    db.prepare(
      `UPDATE actions SET name=?, category=?, weapon_type=?, range=?, attack_kind=?, hit_dc_value=?, damage=?, damage_type=?, notes=?, description=?, max_uses=?, current_uses=?, recharge=?, recharge_label=? WHERE id=?`
    ).run(
      merged.name,
      merged.category,
      merged.weapon_type,
      merged.range,
      merged.attack_kind,
      merged.hit_dc_value,
      merged.damage,
      merged.damage_type,
      merged.notes,
      merged.description,
      merged.max_uses,
      merged.current_uses,
      merged.recharge,
      merged.recharge_label,
      id
    )
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('actions:remove', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM actions WHERE id=?').run(id)
    return buildCharacterAndSync(db)
  })

  // ── Inventory ───────────────────────────────────────────────────────────

  ipcMain.handle('inventory:add', (_e, data: Record<string, unknown>) => {
    const db = getDb()
    const id = uuidv4()
    const count = (db.prepare('SELECT COUNT(*) as c FROM inventory').get() as { c: number }).c
    const damage = (data.damage as string) ?? ''
    const damageType = (data.damage_type as string) ?? ''
    const range = (data.range as string) ?? ''
    db.prepare(
      `INSERT INTO inventory (id, name, category, weight, quantity, cost, notes, equipped, sort_order, damage, damage_type, range)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      data.name,
      data.category ?? 'equipment',
      Number(data.weight) || 0,
      Number(data.quantity) || 1,
      Number(data.cost) || 0,
      data.notes ?? '',
      data.equipped ? 1 : 0,
      count,
      damage,
      damageType,
      range
    )
    syncSourceAction(db, 'item', id, { name: data.name as string, damage, damageType, range })
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('inventory:update', (_e, id: string, changes: Record<string, unknown>) => {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM inventory WHERE id=?').get(id) as InventoryRow | undefined
    if (!existing) return buildCharacterAndSync(db)
    const merged = {
      name: changes.name ?? existing.name,
      category: changes.category ?? existing.category,
      weight: 'weight' in changes ? Number(changes.weight) || 0 : existing.weight,
      quantity: 'quantity' in changes ? Number(changes.quantity) || 0 : existing.quantity,
      cost: 'cost' in changes ? Number(changes.cost) || 0 : existing.cost,
      notes: changes.notes ?? existing.notes,
      equipped: 'equipped' in changes ? (changes.equipped ? 1 : 0) : existing.equipped,
      damage: 'damage' in changes ? (changes.damage as string) : existing.damage,
      damage_type: 'damage_type' in changes ? (changes.damage_type as string) : existing.damage_type,
      range: 'range' in changes ? (changes.range as string) : existing.range
    }
    db.prepare(
      `UPDATE inventory SET name=?, category=?, weight=?, quantity=?, cost=?, notes=?, equipped=?, damage=?, damage_type=?, range=? WHERE id=?`
    ).run(
      merged.name,
      merged.category,
      merged.weight,
      merged.quantity,
      merged.cost,
      merged.notes,
      merged.equipped,
      merged.damage,
      merged.damage_type,
      merged.range,
      id
    )
    syncSourceAction(db, 'item', id, {
      name: merged.name as string,
      damage: merged.damage,
      damageType: merged.damage_type,
      range: merged.range
    })
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('inventory:remove', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM inventory WHERE id=?').run(id)
    db.prepare("DELETE FROM actions WHERE source_type='item' AND source_id=?").run(id)
    return buildCharacterAndSync(db)
  })

  // ── Hit dice ────────────────────────────────────────────────────────────
  // Spending a Hit Die during a short rest is a player choice, not an
  // automatic recharge — this rolls it (+ CON modifier, per 5E) and applies
  // the healing in one step instead of making the player do that math by
  // hand and then type the result into the HP delta box.
  ipcMain.handle('hitDice:spend', () => {
    const db = getDb()
    const row = db.prepare("SELECT * FROM character WHERE id='local'").get() as CharacterRow
    if (!row.hit_dice_current || row.hit_dice_current <= 0) return { character: buildCharacter(db), rolled: 0 }

    const dieMax = parseInt(row.hit_die_size.replace(/^d/i, ''), 10) || 8
    const roll = Math.floor(Math.random() * dieMax) + 1
    const conMod = Math.floor((row.con_score - 10) / 2)
    const healed = Math.max(1, roll + conMod) // a Hit Die always heals at least 1

    const nextCurrent = (row.hp_current ?? 0) + healed
    const cappedCurrent = row.hp_max != null ? Math.min(row.hp_max, nextCurrent) : nextCurrent

    db.prepare("UPDATE character SET hit_dice_current=?, hp_current=? WHERE id='local'").run(
      row.hit_dice_current - 1,
      cappedCurrent
    )
    return { character: buildCharacterAndSync(db), rolled: roll, healed }
  })

  // ── Rest ────────────────────────────────────────────────────────────────
  // A long rest restores everything a short rest does, plus spell slots.
  // "dawn" and "custom" recharges are intentionally left out of both — they
  // aren't tied to resting, so each ability row carries its own manual
  // reset instead.

  ipcMain.handle('rest:short', () => {
    const db = getDb()
    db.prepare(
      "UPDATE abilities SET current_uses = max_uses WHERE recharge = 'short_rest' AND max_uses IS NOT NULL"
    ).run()
    db.prepare(
      "UPDATE actions SET current_uses = max_uses WHERE recharge = 'short_rest' AND max_uses IS NOT NULL"
    ).run()
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('rest:long', () => {
    const db = getDb()
    db.prepare(
      "UPDATE abilities SET current_uses = max_uses WHERE recharge IN ('short_rest','long_rest') AND max_uses IS NOT NULL"
    ).run()
    db.prepare(
      "UPDATE actions SET current_uses = max_uses WHERE recharge IN ('short_rest','long_rest') AND max_uses IS NOT NULL"
    ).run()
    db.prepare('UPDATE spell_slots SET current = max').run()

    // 5E: a long rest regains spent Hit Dice, up to half your total (min 1)
    // — never the whole pool back at once. Temp HP doesn't survive a long
    // rest either (PHB: "until they're depleted or you finish a long rest").
    const character = db.prepare("SELECT hit_dice_total, hit_dice_current FROM character WHERE id='local'").get() as
      | { hit_dice_total: number | null; hit_dice_current: number | null }
      | undefined
    if (character?.hit_dice_total != null) {
      const total = character.hit_dice_total
      const current = character.hit_dice_current ?? total
      const regained = Math.max(1, Math.floor(total / 2))
      const next = Math.min(total, current + regained)
      db.prepare("UPDATE character SET hit_dice_current=? WHERE id='local'").run(next)
    }
    db.prepare("UPDATE character SET hp_temp=0 WHERE id='local'").run()

    return buildCharacterAndSync(db)
  })
}
