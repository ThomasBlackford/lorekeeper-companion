import { ipcMain } from 'electron'
import { connect, disconnect, getStatus, getPartyMessages, getDmReplies, sendDmMessage, sendPartyMessage } from '../sync'

export function registerSyncHandlers(): void {
  ipcMain.handle('sync:connect', (_e, address: string) => connect(address))
  ipcMain.handle('sync:disconnect', () => disconnect())
  ipcMain.handle('sync:status', () => ({
    ...getStatus(),
    messages: getPartyMessages(),
    dmReplies: getDmReplies()
  }))
  ipcMain.handle('sync:sendDmMessage', (_e, text: string) => sendDmMessage(text))
  ipcMain.handle('sync:sendPartyMessage', (_e, text: string) => sendPartyMessage(text))
}
