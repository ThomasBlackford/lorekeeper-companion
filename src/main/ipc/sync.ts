import { ipcMain } from 'electron'
import { connect, disconnect, getStatus, getPartyMessages, getDmReplies, sendDmMessage, sendPartyMessage, sendRollResult } from '../sync'

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:connect', (_e, address: string, code?: string) => connect(address, code ?? ''))
  ipcMain.handle('sync:sendRollResult', (_e, payload: Parameters<typeof sendRollResult>[0]) => sendRollResult(payload))
  ipcMain.handle('sync:disconnect', () => disconnect())
  ipcMain.handle('sync:status', () => ({
    ...getStatus(),
    messages: getPartyMessages(),
    dmReplies: getDmReplies()
  }))
  ipcMain.handle('sync:sendDmMessage', (_e, text: string) => sendDmMessage(text))
  ipcMain.handle('sync:sendPartyMessage', (_e, text: string) => sendPartyMessage(text))
}
