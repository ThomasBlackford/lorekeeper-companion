import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const api = {
  character: {
    get: () => ipcRenderer.invoke('character:get'),
    save: (changes: Record<string, unknown>) => ipcRenderer.invoke('character:save', changes),
    updateResources: (resources: unknown[]) => ipcRenderer.invoke('character:updateResources', resources),
    updateDefenses: (defenses: unknown[]) => ipcRenderer.invoke('character:updateDefenses', defenses),
    updateConditions: (conditions: unknown[]) => ipcRenderer.invoke('character:updateConditions', conditions),
    updateBackground: (background: unknown) => ipcRenderer.invoke('character:updateBackground', background),
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
  sync: {
    connect: (address: string) => ipcRenderer.invoke('sync:connect', address),
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
