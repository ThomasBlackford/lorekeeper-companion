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
  str_score: number
  dex_score: number
  con_score: number
  int_score: number
  wis_score: number
  cha_score: number
  hp_current: number | null
  hp_max: number | null
  spellcasting_ability: string | null
  gold: number
  notes: string
  background: string
  dm_server_address: string
  resources: string
  defenses: string
  conditions: string
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
    str_score: row.str_score,
    dex_score: row.dex_score,
    con_score: row.con_score,
    int_score: row.int_score,
    wis_score: row.wis_score,
    cha_score: row.cha_score,
    hp_current: row.hp_current,
    hp_max: row.hp_max,
    spellcasting_ability: row.spellcasting_ability,
    gold: row.gold,
    notes: row.notes,
    background: JSON.parse(row.background || '{}'),
    dm_server_address: row.dm_server_address,
    resources: JSON.parse(row.resources || '[]'),
    defenses: JSON.parse(row.defenses || '[]'),
    conditions: JSON.parse(row.conditions || '[]'),
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
    hp_current: character.hp_current,
    hp_max: character.hp_max,
    spellSlots: character.spellSlots,
    resources: character.resources,
    conditions: character.conditions
  })
  return character
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
    const strScore = 'str_score' in changes ? (changes.str_score as number) : existing.str_score
    const dexScore = 'dex_score' in changes ? (changes.dex_score as number) : existing.dex_score
    const conScore = 'con_score' in changes ? (changes.con_score as number) : existing.con_score
    const intScore = 'int_score' in changes ? (changes.int_score as number) : existing.int_score
    const wisScore = 'wis_score' in changes ? (changes.wis_score as number) : existing.wis_score
    const chaScore = 'cha_score' in changes ? (changes.cha_score as number) : existing.cha_score
    const hpCurrent = 'hp_current' in changes ? (changes.hp_current as number | null) : existing.hp_current
    const hpMax = 'hp_max' in changes ? (changes.hp_max as number | null) : existing.hp_max
    const spellcastingAbility =
      'spellcasting_ability' in changes
        ? (changes.spellcasting_ability as string | null)
        : existing.spellcasting_ability
    const gold = 'gold' in changes ? (changes.gold as number) : existing.gold
    const notes = 'notes' in changes ? (changes.notes as string) : existing.notes
    const dmServerAddress =
      'dm_server_address' in changes ? (changes.dm_server_address as string) : existing.dm_server_address

    db.prepare(
      `UPDATE character SET name=?, race=?, class=?, level=?, alignment=?, ac=?, proficiency_bonus=?, speed=?,
       str_score=?, dex_score=?, con_score=?, int_score=?, wis_score=?, cha_score=?, hp_current=?, hp_max=?,
       spellcasting_ability=?, gold=?, notes=?, dm_server_address=?
       WHERE id=?`
    ).run(
      name, race, charClass, level, alignment, ac, proficiencyBonus, speed,
      strScore, dexScore, conScore, intScore, wisScore, chaScore, hpCurrent, hpMax,
      spellcastingAbility, gold, notes, dmServerAddress,
      CHAR_ID
    )
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
    const count = (db.prepare('SELECT COUNT(*) as c FROM spells').get() as { c: number }).c
    db.prepare(
      `INSERT INTO spells (id, name, level, school, casting_time, range, duration, ritual, concentration, prepared, description, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      uuidv4(),
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
      count
    )
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
      description: changes.description ?? existing.description
    }
    db.prepare(
      `UPDATE spells SET name=?, level=?, school=?, casting_time=?, range=?, duration=?, ritual=?, concentration=?, prepared=?, description=? WHERE id=?`
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
      id
    )
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('spells:remove', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM spells WHERE id=?').run(id)
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
    const count = (db.prepare('SELECT COUNT(*) as c FROM inventory').get() as { c: number }).c
    db.prepare(
      `INSERT INTO inventory (id, name, category, weight, quantity, cost, notes, equipped, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(
      uuidv4(),
      data.name,
      data.category ?? 'equipment',
      Number(data.weight) || 0,
      Number(data.quantity) || 1,
      Number(data.cost) || 0,
      data.notes ?? '',
      data.equipped ? 1 : 0,
      count
    )
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
      equipped: 'equipped' in changes ? (changes.equipped ? 1 : 0) : existing.equipped
    }
    db.prepare(
      `UPDATE inventory SET name=?, category=?, weight=?, quantity=?, cost=?, notes=?, equipped=? WHERE id=?`
    ).run(
      merged.name,
      merged.category,
      merged.weight,
      merged.quantity,
      merged.cost,
      merged.notes,
      merged.equipped,
      id
    )
    return buildCharacterAndSync(db)
  })

  ipcMain.handle('inventory:remove', (_e, id: string) => {
    const db = getDb()
    db.prepare('DELETE FROM inventory WHERE id=?').run(id)
    return buildCharacterAndSync(db)
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
    return buildCharacterAndSync(db)
  })
}
