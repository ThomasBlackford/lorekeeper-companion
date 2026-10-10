import { app, ipcMain } from 'electron'
import { isUpdateReady, installUpdateNow } from '../updater'

export function registerUpdaterHandlers(): void {
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('updater:status', () => ({ ready: isUpdateReady() }))
  ipcMain.handle('updater:install', () => installUpdateNow())
}
