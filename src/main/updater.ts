import { autoUpdater } from 'electron-updater'
import { getMainWin } from './mainWindow'

const CHECK_INTERVAL_MS = 2 * 60 * 60 * 1000 // 2 hours

let updateReady = false

// Checks quietly in the background and downloads automatically, but never
// installs on its own — this app runs during live tabletop sessions, and a
// surprise restart mid-combat would be a real problem. Installing only ever
// happens when installUpdateNow() is called, which is only ever reached by
// the player clicking "Restart to update" in the app itself.
export function initAutoUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('update-downloaded', () => {
    updateReady = true
    const win = getMainWin()
    if (win && !win.isDestroyed()) win.webContents.send('updater:ready')
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] error:', err)
  })

  checkNow()
  setInterval(checkNow, CHECK_INTERVAL_MS)
}

function checkNow(): void {
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[updater] check failed:', err)
  })
}

export function isUpdateReady(): boolean {
  return updateReady
}

export function installUpdateNow(): void {
  autoUpdater.quitAndInstall()
}
