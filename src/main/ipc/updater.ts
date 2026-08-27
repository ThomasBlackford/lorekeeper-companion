import { ipcMain } from 'electron'
import { isUpdateReady, installUpdateNow } from '../updater'

export function registerUpdaterHandlers(): void {
  ipcMain.handle('updater:status', () => ({ ready: isUpdateReady() }))
  ipcMain.handle('updater:install', () => installUpdateNow())
}
