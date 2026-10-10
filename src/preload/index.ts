import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const api = {
  character: {
    get: () => ipcRenderer.invoke('character:get'),
    save: (changes: Record<string, unknown>) => ipcRenderer.invoke('character:save', changes),
    updateResources: (resources: unknown[]) => ipcRenderer.invoke('character:updateResources', resources),
    updateDefenses: (defenses: unknown[]) => ipcRenderer.invoke('character:updateDefenses', defenses),
    updateConditions: (conditions: unknown[]) => ipcRenderer.invoke('character:updateConditions', conditions),
    updateBackground: (background: unknown) => ipcRenderer.invoke('character:updateBackground', background),
    pickPortrait: () => ipcRenderer.invoke('character:pickPortrait'),
    clearPortrait: () => ipcRenderer.invoke('character:clearPortrait'),
    updateSkills: (skills: unknown) => ipcRenderer.invoke('character:updateSkills', skills),
    updateProficiencies: (changes: Record<string, unknown>) =>
      ipcRenderer.invoke('character:updateProficiencies', changes)
  },
  spells: {
    add: (data: Record<string, unknown>) => ipcRenderer.invoke('spells:add', data),
    update: (id: string, changes: Record<string, unknown>) => ipcRenderer.invoke('spells:update', id, changes),
    remove: (id: string) => ipcRenderer.invoke('spells:remove', id)
  },
  spellSlots: {
    update: (level: number, changes: Record<string, unknown>) =>
      ipcRenderer.invoke('spellSlots:update', level, changes)
  },
  abilities: {
    add: (data: Record<string, unknown>) => ipcRenderer.invoke('abilities:add', data),
    update: (id: string, changes: Record<string, unknown>) => ipcRenderer.invoke('abilities:update', id, changes),
    remove: (id: string) => ipcRenderer.invoke('abilities:remove', id)
  },
  actions: {
    add: (data: Record<string, unknown>) => ipcRenderer.invoke('actions:add', data),
    update: (id: string, changes: Record<string, unknown>) => ipcRenderer.invoke('actions:update', id, changes),
    remove: (id: string) => ipcRenderer.invoke('actions:remove', id)
  },
  inventory: {
    add: (data: Record<string, unknown>) => ipcRenderer.invoke('inventory:add', data),
    update: (id: string, changes: Record<string, unknown>) => ipcRenderer.invoke('inventory:update', id, changes),
    remove: (id: string) => ipcRenderer.invoke('inventory:remove', id)
  },
  rest: {
    short: () => ipcRenderer.invoke('rest:short'),
    long: () => ipcRenderer.invoke('rest:long')
  },
  hitDice: {
    spend: () => ipcRenderer.invoke('hitDice:spend')
  },
  sync: {
    connect: (address: string, code?: string) => ipcRenderer.invoke('sync:connect', address, code),
    sendRollResult: (payload: unknown) => ipcRenderer.invoke('sync:sendRollResult', payload),
    onDmEvent: (cb: (evt: unknown) => void) => {
      const handler = (_e: IpcRendererEvent, evt: unknown) => cb(evt)
      ipcRenderer.on('dm:event', handler)
      return () => ipcRenderer.removeListener('dm:event', handler)
    },
    onCharacterChanged: (cb: (c: unknown) => void) => {
      const handler = (_e: IpcRendererEvent, c: unknown) => cb(c)
      ipcRenderer.on('character:changed', handler)
      return () => ipcRenderer.removeListener('character:changed', handler)
    },
    disconnect: () => ipcRenderer.invoke('sync:disconnect'),
    status: () => ipcRenderer.invoke('sync:status'),
    sendDmMessage: (text: string) => ipcRenderer.invoke('sync:sendDmMessage', text),
    sendPartyMessage: (text: string) => ipcRenderer.invoke('sync:sendPartyMessage', text),
    onStatus: (cb: (status: unknown) => void) => {
      const handler = (_e: IpcRendererEvent, status: unknown) => cb(status)
      ipcRenderer.on('sync:status', handler)
      return () => ipcRenderer.removeListener('sync:status', handler)
    },
    onPartyMessage: (cb: (msg: unknown) => void) => {
      const handler = (_e: IpcRendererEvent, msg: unknown) => cb(msg)
      ipcRenderer.on('sync:partyMessage', handler)
      return () => ipcRenderer.removeListener('sync:partyMessage', handler)
    },
    onDmReply: (cb: (msg: unknown) => void) => {
      const handler = (_e: IpcRendererEvent, msg: unknown) => cb(msg)
      ipcRenderer.on('sync:dmReply', handler)
      return () => ipcRenderer.removeListener('sync:dmReply', handler)
    }
  },
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    import: () => ipcRenderer.invoke('backup:import'),
    info: () => ipcRenderer.invoke('backup:info'),
    openFolder: () => ipcRenderer.invoke('backup:openFolder')
  },
  app: {
    version: () => ipcRenderer.invoke('app:version') as Promise<string>
  },
  updater: {
    status: () => ipcRenderer.invoke('updater:status'),
    install: () => ipcRenderer.invoke('updater:install'),
    onReady: (cb: () => void) => {
      const handler = () => cb()
      ipcRenderer.on('updater:ready', handler)
      return () => ipcRenderer.removeListener('updater:ready', handler)
    },
  }
}

contextBridge.exposeInMainWorld('api', api)
