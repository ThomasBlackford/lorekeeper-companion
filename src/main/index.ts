import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDb, getDb } from './db'
import { setMainWin, getMainWin } from './mainWindow'
import { registerCharacterHandlers } from './ipc/character'
import { registerSyncHandlers } from './ipc/sync'
import { registerUpdaterHandlers } from './ipc/updater'
import { connect, disconnect } from './sync'
import { initAutoUpdater } from './updater'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1000,
    height: 780,
    minWidth: 480,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  setMainWin(win)

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// A second launch shares the same local database (same client_id), so it'd
// silently open a second connection under the same identity and fight the
// first window for which one the DM actually sees as "live." Redirect it to
// focus the existing window instead.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getMainWin()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.lorekeeper.companion')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    initDb(app.getPath('userData'))
    registerCharacterHandlers()
    registerSyncHandlers()
    registerUpdaterHandlers()

    createWindow()

    // Skipped outside a packaged build — there's no update feed to check
    // against in dev, and electron-updater errors loudly if it tries.
    if (app.isPackaged) initAutoUpdater()

    // Reconnect to whatever DM server was last used, if any — harmless if
    // it's not reachable, just leaves the app in its normal disconnected
    // state until the player connects manually from Settings.
    const saved = getDb().prepare("SELECT dm_server_address FROM character WHERE id='local'").get() as
      | { dm_server_address: string }
      | undefined
    if (saved?.dm_server_address) connect(saved.dm_server_address)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    disconnect()
    if (process.platform !== 'darwin') app.quit()
  })
}
