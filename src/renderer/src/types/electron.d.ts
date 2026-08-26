import type {
  Ability, Background, Character, CombatAction, Condition, Defense, DmReply,
  InventoryItem, PartyChatMessage, Resource, Spell, SyncStatus
} from './index'

interface ElectronAPI {
  character: {
    get: () => Promise<Character>
    save: (
      changes: Partial<
        Pick<
          Character,
          | 'name' | 'race' | 'class' | 'level' | 'alignment'
          | 'ac' | 'proficiency_bonus' | 'speed' | 'initiative'
          | 'str_score' | 'dex_score' | 'con_score' | 'int_score' | 'wis_score' | 'cha_score'
          | 'hp_current' | 'hp_max'
          | 'spellcasting_ability' | 'gold' | 'notes' | 'dm_server_address'
        >
      >
    ) => Promise<Character>
    updateResources: (resources: Resource[]) => Promise<Character>
    updateDefenses: (defenses: Defense[]) => Promise<Character>
    updateConditions: (conditions: Condition[]) => Promise<Character>
    updateBackground: (background: Background) => Promise<Character>
  }
  spells: {
    add: (data: Partial<Spell> & { name: string }) => Promise<Character>
    update: (id: string, changes: Partial<Spell>) => Promise<Character>
    remove: (id: string) => Promise<Character>
  }
  spellSlots: {
    update: (level: number, changes: Partial<{ max: number; current: number }>) => Promise<Character>
  }
  abilities: {
    add: (data: Partial<Ability> & { name: string }) => Promise<Character>
    update: (id: string, changes: Partial<Ability>) => Promise<Character>
    remove: (id: string) => Promise<Character>
  }
  actions: {
    add: (data: Partial<CombatAction> & { name: string }) => Promise<Character>
    update: (id: string, changes: Partial<CombatAction>) => Promise<Character>
    remove: (id: string) => Promise<Character>
  }
  inventory: {
    add: (data: Partial<InventoryItem> & { name: string }) => Promise<Character>
    update: (id: string, changes: Partial<InventoryItem>) => Promise<Character>
    remove: (id: string) => Promise<Character>
  }
  rest: {
    short: () => Promise<Character>
    long: () => Promise<Character>
  }
  sync: {
    connect: (address: string) => Promise<{ ok: boolean; error?: string }>
    disconnect: () => Promise<void>
    status: () => Promise<SyncStatus & { messages: PartyChatMessage[]; dmReplies: DmReply[] }>
    sendDmMessage: (text: string) => Promise<void>
    sendPartyMessage: (text: string) => Promise<void>
    onStatus: (cb: (status: SyncStatus) => void) => () => void
    onPartyMessage: (cb: (msg: PartyChatMessage) => void) => () => void
    onDmReply: (cb: (msg: DmReply) => void) => () => void
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
