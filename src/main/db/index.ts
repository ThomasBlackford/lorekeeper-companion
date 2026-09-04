import Database from 'better-sqlite3'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

let db: Database.Database | null = null

// Everything here is local to the player's own machine — this is a cache +
// personal sheet, not shared storage. Syncing to the DM's app over LAN is a
// later addition; this app works fully standalone until then.
export function initDb(userDataPath: string): void {
  const dbPath = join(userDataPath, 'companion.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createSchema()
  runMigrations()
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

function createSchema(): void {
  const d = getDb()

  d.exec(`
    CREATE TABLE IF NOT EXISTS character (
      id                TEXT PRIMARY KEY,
      name              TEXT NOT NULL DEFAULT '',
      race              TEXT NOT NULL DEFAULT '',
      class             TEXT NOT NULL DEFAULT '',
      level             INTEGER NOT NULL DEFAULT 1,
      alignment         TEXT NOT NULL DEFAULT '',
      ac                INTEGER,
      proficiency_bonus INTEGER,
      speed             INTEGER,
      str_score         INTEGER NOT NULL DEFAULT 10,
      dex_score         INTEGER NOT NULL DEFAULT 10,
      con_score         INTEGER NOT NULL DEFAULT 10,
      int_score         INTEGER NOT NULL DEFAULT 10,
      wis_score         INTEGER NOT NULL DEFAULT 10,
      cha_score         INTEGER NOT NULL DEFAULT 10,
      hp_current        INTEGER,
      hp_max            INTEGER,
      hp_temp           INTEGER NOT NULL DEFAULT 0,
      death_save_successes INTEGER NOT NULL DEFAULT 0,
      death_save_failures  INTEGER NOT NULL DEFAULT 0,
      hit_dice_total    INTEGER,
      hit_dice_current  INTEGER,
      hit_die_size      TEXT NOT NULL DEFAULT 'd8',
      inspiration       INTEGER NOT NULL DEFAULT 0,
      concentration_spell_name TEXT NOT NULL DEFAULT '',
      exhaustion_level  INTEGER NOT NULL DEFAULT 0,
      spellcasting_ability TEXT,
      gold              INTEGER NOT NULL DEFAULT 0,
      notes             TEXT NOT NULL DEFAULT '',
      background        TEXT NOT NULL DEFAULT '{}',
      dm_server_address TEXT NOT NULL DEFAULT '',
      client_id         TEXT NOT NULL DEFAULT '',
      initiative        INTEGER,
      initiative_bonus  INTEGER NOT NULL DEFAULT 0,
      spellcasting_class TEXT NOT NULL DEFAULT '',
      resources         TEXT NOT NULL DEFAULT '[]',
      defenses          TEXT NOT NULL DEFAULT '[]',
      conditions        TEXT NOT NULL DEFAULT '[]',
      skills             TEXT NOT NULL DEFAULT '{}',
      save_proficiencies TEXT NOT NULL DEFAULT '[]',
      armor_proficiencies TEXT NOT NULL DEFAULT '[]',
      weapon_proficiencies TEXT NOT NULL DEFAULT '[]',
      tool_proficiencies TEXT NOT NULL DEFAULT '[]',
      languages          TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS spells (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      level         INTEGER NOT NULL DEFAULT 0,
      school        TEXT NOT NULL DEFAULT '',
      casting_time  TEXT NOT NULL DEFAULT '',
      range         TEXT NOT NULL DEFAULT '',
      duration      TEXT NOT NULL DEFAULT '',
      ritual        INTEGER NOT NULL DEFAULT 0,
      concentration INTEGER NOT NULL DEFAULT 0,
      prepared      INTEGER NOT NULL DEFAULT 0,
      description   TEXT NOT NULL DEFAULT '',
      damage        TEXT NOT NULL DEFAULT '',
      damage_type   TEXT NOT NULL DEFAULT '',
      attack_kind   TEXT NOT NULL DEFAULT 'attack_roll',
      sort_order    INTEGER NOT NULL DEFAULT 0
    );

    -- One row per spell level 1-9. Slots are a shared pool, not tied to a
    -- single spell, so they're modeled separately from the spells table.
    CREATE TABLE IF NOT EXISTS spell_slots (
      level   INTEGER PRIMARY KEY,
      max     INTEGER NOT NULL DEFAULT 0,
      current INTEGER NOT NULL DEFAULT 0
    );

    -- Covers class features, feats, racial traits — anything with a name,
    -- optional limited uses, and a recharge trigger. Prepackaged and
    -- homebrew entries are the same shape; there's nothing a built-in
    -- ability can do that a custom one can't.
    CREATE TABLE IF NOT EXISTS abilities (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      category       TEXT NOT NULL DEFAULT 'class_feature',
      description    TEXT NOT NULL DEFAULT '',
      max_uses       INTEGER,
      current_uses   INTEGER,
      recharge       TEXT NOT NULL DEFAULT 'long_rest',
      recharge_label TEXT NOT NULL DEFAULT '',
      sort_order     INTEGER NOT NULL DEFAULT 0
    );

    -- Attacks and other combat actions — the structured "quick stats" table
    -- (range/hit-DC/damage/notes) plus an optional long-form description.
    -- Limited-use ones share the exact same uses/recharge shape as
    -- abilities, reset by the same short/long rest handlers.
    CREATE TABLE IF NOT EXISTS actions (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      category       TEXT NOT NULL DEFAULT 'action',
      weapon_type    TEXT NOT NULL DEFAULT '',
      range          TEXT NOT NULL DEFAULT '',
      attack_kind    TEXT NOT NULL DEFAULT 'attack_roll',
      hit_dc_value   INTEGER,
      damage         TEXT NOT NULL DEFAULT '',
      damage_type    TEXT NOT NULL DEFAULT '',
      notes          TEXT NOT NULL DEFAULT '',
      description    TEXT NOT NULL DEFAULT '',
      max_uses       INTEGER,
      current_uses   INTEGER,
      recharge       TEXT NOT NULL DEFAULT 'long_rest',
      recharge_label TEXT NOT NULL DEFAULT '',
      sort_order     INTEGER NOT NULL DEFAULT 0,
      -- Set only on an action auto-generated from a spell/weapon's damage
      -- field (see syncSourceAction in ipc/character.ts) — NULL for every
      -- action the player created by hand, which this sync never touches.
      source_type    TEXT,
      source_id      TEXT
    );

    -- Carried gear. Weight capacity (STR score × 15) and total weight
    -- carried are computed client-side from this list, not stored.
    CREATE TABLE IF NOT EXISTS inventory (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'equipment',
      weight      REAL NOT NULL DEFAULT 0,
      quantity    INTEGER NOT NULL DEFAULT 1,
      cost        REAL NOT NULL DEFAULT 0,
      notes       TEXT NOT NULL DEFAULT '',
      equipped    INTEGER NOT NULL DEFAULT 0,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      damage      TEXT NOT NULL DEFAULT '',
      damage_type TEXT NOT NULL DEFAULT '',
      range       TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL DEFAULT 0
    );
  `)

  // Single local character — this app tracks one player's one sheet per
  // install, so there's no character list/switcher to build yet.
  const existing = d.prepare('SELECT id FROM character WHERE id = ?').get('local')
  if (!existing) {
    d.prepare(
      `INSERT INTO character (id, name, race, class, level, alignment, background, client_id, resources, defenses, conditions)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run('local', 'New Character', '', '', 1, '', '{}', uuidv4(), '[]', '[]', '[]')
  }

  // Seed empty slot rows 1-9 so the UI always has something to edit.
  const slotCount = (d.prepare('SELECT COUNT(*) as c FROM spell_slots').get() as { c: number }).c
  if (slotCount === 0) {
    const insertSlot = d.prepare('INSERT INTO spell_slots (level, max, current) VALUES (?, 0, 0)')
    for (let lvl = 1; lvl <= 9; lvl++) insertSlot.run(lvl)
  }
}

function runMigrations(): void {
  const d = getDb()

  let row = d.prepare('SELECT version FROM schema_version').get() as { version: number } | undefined
  if (!row) {
    d.prepare('INSERT INTO schema_version (version) VALUES (0)').run()
    row = { version: 0 }
  }

  const v = row.version

  if (v < 1) {
    // Upgrade path for a `character` table created before the full stat
    // block existed — adds the new columns without touching existing rows.
    // Fresh installs already have every column from createSchema() above,
    // so each addCol() below is a no-op for them.
    const cols = d.prepare('PRAGMA table_info(character)').all() as { name: string }[]
    const names = new Set(cols.map((c) => c.name))
    const addCol = (name: string, def: string): void => {
      if (!names.has(name)) d.exec(`ALTER TABLE character ADD COLUMN ${name} ${def}`)
    }
    addCol('race', "TEXT NOT NULL DEFAULT ''")
    addCol('class', "TEXT NOT NULL DEFAULT ''")
    addCol('level', 'INTEGER NOT NULL DEFAULT 1')
    addCol('alignment', "TEXT NOT NULL DEFAULT ''")
    addCol('ac', 'INTEGER')
    addCol('proficiency_bonus', 'INTEGER')
    addCol('speed', 'INTEGER')
    addCol('str_score', 'INTEGER NOT NULL DEFAULT 10')
    addCol('dex_score', 'INTEGER NOT NULL DEFAULT 10')
    addCol('con_score', 'INTEGER NOT NULL DEFAULT 10')
    addCol('int_score', 'INTEGER NOT NULL DEFAULT 10')
    addCol('wis_score', 'INTEGER NOT NULL DEFAULT 10')
    addCol('cha_score', 'INTEGER NOT NULL DEFAULT 10')
    addCol('defenses', "TEXT NOT NULL DEFAULT '[]'")
    addCol('conditions', "TEXT NOT NULL DEFAULT '[]'")
    d.prepare('UPDATE schema_version SET version = 1').run()
  }

  if (v < 2) {
    // Adds spellcasting stats, currency, notes, and the background blob to
    // `character`, plus a category column to `abilities` for the
    // Features & Traits filter tabs. New installs already have all of this
    // via createSchema() above.
    const charCols = d.prepare('PRAGMA table_info(character)').all() as { name: string }[]
    const charNames = new Set(charCols.map((c) => c.name))
    const addCharCol = (name: string, def: string): void => {
      if (!charNames.has(name)) d.exec(`ALTER TABLE character ADD COLUMN ${name} ${def}`)
    }
    addCharCol('spellcasting_ability', 'TEXT')
    addCharCol('gold', 'INTEGER NOT NULL DEFAULT 0')
    addCharCol('notes', "TEXT NOT NULL DEFAULT ''")
    addCharCol('background', "TEXT NOT NULL DEFAULT '{}'")

    const abilityCols = d.prepare('PRAGMA table_info(abilities)').all() as { name: string }[]
    if (!abilityCols.some((c) => c.name === 'category')) {
      d.exec("ALTER TABLE abilities ADD COLUMN category TEXT NOT NULL DEFAULT 'class_feature'")
    }

    d.prepare('UPDATE schema_version SET version = 2').run()
  }

  if (v < 3) {
    // Persists the DM server address so players don't retype it every
    // launch. New installs already have it via createSchema() above.
    const charCols = d.prepare('PRAGMA table_info(character)').all() as { name: string }[]
    if (!charCols.some((c) => c.name === 'dm_server_address')) {
      d.exec("ALTER TABLE character ADD COLUMN dm_server_address TEXT NOT NULL DEFAULT ''")
    }
    d.prepare('UPDATE schema_version SET version = 3').run()
  }

  if (v < 4) {
    // A stable per-install identity, sent with every message over sync so
    // the DM app can recognize "this is the same player" across
    // reconnects — without it, a dropped WiFi connection would fragment a
    // player's message history into a new thread every time.
    const charCols = d.prepare('PRAGMA table_info(character)').all() as { name: string }[]
    if (!charCols.some((c) => c.name === 'client_id')) {
      d.exec("ALTER TABLE character ADD COLUMN client_id TEXT NOT NULL DEFAULT ''")
    }
    const row = d.prepare("SELECT client_id FROM character WHERE id='local'").get() as
      | { client_id: string }
      | undefined
    if (row && !row.client_id) {
      d.prepare("UPDATE character SET client_id=? WHERE id='local'").run(uuidv4())
    }
    d.prepare('UPDATE schema_version SET version = 4').run()
  }

  if (v < 5) {
    // Initiative is now something the player rolls/enters on their own
    // sheet — it syncs to the DM's roster instead of the DM typing it in.
    const charCols = d.prepare('PRAGMA table_info(character)').all() as { name: string }[]
    if (!charCols.some((c) => c.name === 'initiative')) {
      d.exec('ALTER TABLE character ADD COLUMN initiative INTEGER')
    }
    d.prepare('UPDATE schema_version SET version = 5').run()
  }

  if (v < 6) {
    // Full skills/proficiencies section: the 18 skill proficiency levels,
    // saving throw proficiencies, a flat initiative bonus (feats/items on
    // top of the DEX-derived roll), armor/weapon/tool proficiencies,
    // languages, and which class's ability drives spellcasting. New installs
    // already have all of this via createSchema() above.
    const charCols = d.prepare('PRAGMA table_info(character)').all() as { name: string }[]
    const charNames = new Set(charCols.map((c) => c.name))
    const addCharCol = (name: string, def: string): void => {
      if (!charNames.has(name)) d.exec(`ALTER TABLE character ADD COLUMN ${name} ${def}`)
    }
    addCharCol('initiative_bonus', 'INTEGER NOT NULL DEFAULT 0')
    addCharCol('spellcasting_class', "TEXT NOT NULL DEFAULT ''")
    addCharCol('skills', "TEXT NOT NULL DEFAULT '{}'")
    addCharCol('save_proficiencies', "TEXT NOT NULL DEFAULT '[]'")
    addCharCol('armor_proficiencies', "TEXT NOT NULL DEFAULT '[]'")
    addCharCol('weapon_proficiencies', "TEXT NOT NULL DEFAULT '[]'")
    addCharCol('tool_proficiencies', "TEXT NOT NULL DEFAULT '[]'")
    addCharCol('languages', "TEXT NOT NULL DEFAULT '[]'")
    d.prepare('UPDATE schema_version SET version = 6').run()
  }

  if (v < 7) {
    // Combat essentials that were missing entirely: temp HP, death saves,
    // a hit dice pool (for short rests), inspiration, and a concentration
    // indicator. New installs already have all of this via createSchema().
    const charCols = d.prepare('PRAGMA table_info(character)').all() as { name: string }[]
    const charNames = new Set(charCols.map((c) => c.name))
    const addCharCol = (name: string, def: string): void => {
      if (!charNames.has(name)) d.exec(`ALTER TABLE character ADD COLUMN ${name} ${def}`)
    }
    addCharCol('hp_temp', 'INTEGER NOT NULL DEFAULT 0')
    addCharCol('death_save_successes', 'INTEGER NOT NULL DEFAULT 0')
    addCharCol('death_save_failures', 'INTEGER NOT NULL DEFAULT 0')
    addCharCol('hit_dice_total', 'INTEGER')
    addCharCol('hit_dice_current', 'INTEGER')
    addCharCol('hit_die_size', "TEXT NOT NULL DEFAULT 'd8'")
    addCharCol('inspiration', 'INTEGER NOT NULL DEFAULT 0')
    addCharCol('concentration_spell_name', "TEXT NOT NULL DEFAULT ''")
    d.prepare('UPDATE schema_version SET version = 7').run()
  }

  if (v < 8) {
    // Exhaustion has escalating levels (1-6) under 5E rules, not just an
    // on/off state — tracked separately from the fixed Exhausted condition
    // badge so it doesn't have to become a special case there.
    const charCols = d.prepare('PRAGMA table_info(character)').all() as { name: string }[]
    if (!charCols.some((c) => c.name === 'exhaustion_level')) {
      d.exec('ALTER TABLE character ADD COLUMN exhaustion_level INTEGER NOT NULL DEFAULT 0')
    }
    d.prepare('UPDATE schema_version SET version = 8').run()
  }

  if (v < 9) {
    // Damage on spells and weapon-like inventory items, which now
    // auto-generate/update a linked row in `actions` (see syncSourceAction
    // in ipc/character.ts) instead of the player retyping the same attack
    // into the Actions tab by hand. New installs already have all of this
    // via createSchema() above.
    const spellCols = d.prepare('PRAGMA table_info(spells)').all() as { name: string }[]
    const spellNames = new Set(spellCols.map((c) => c.name))
    if (!spellNames.has('damage')) d.exec("ALTER TABLE spells ADD COLUMN damage TEXT NOT NULL DEFAULT ''")
    if (!spellNames.has('damage_type')) d.exec("ALTER TABLE spells ADD COLUMN damage_type TEXT NOT NULL DEFAULT ''")
    if (!spellNames.has('attack_kind')) d.exec("ALTER TABLE spells ADD COLUMN attack_kind TEXT NOT NULL DEFAULT 'attack_roll'")

    const invCols = d.prepare('PRAGMA table_info(inventory)').all() as { name: string }[]
    const invNames = new Set(invCols.map((c) => c.name))
    if (!invNames.has('damage')) d.exec("ALTER TABLE inventory ADD COLUMN damage TEXT NOT NULL DEFAULT ''")
    if (!invNames.has('damage_type')) d.exec("ALTER TABLE inventory ADD COLUMN damage_type TEXT NOT NULL DEFAULT ''")
    if (!invNames.has('range')) d.exec("ALTER TABLE inventory ADD COLUMN range TEXT NOT NULL DEFAULT ''")

    const actionCols = d.prepare('PRAGMA table_info(actions)').all() as { name: string }[]
    const actionNames = new Set(actionCols.map((c) => c.name))
    if (!actionNames.has('source_type')) d.exec('ALTER TABLE actions ADD COLUMN source_type TEXT')
    if (!actionNames.has('source_id')) d.exec('ALTER TABLE actions ADD COLUMN source_id TEXT')

    d.prepare('UPDATE schema_version SET version = 9').run()
  }
}
