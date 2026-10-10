import { app, dialog, ipcMain, shell } from 'electron'
import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync } from 'fs'
import { join } from 'path'
import { closeDb, getDb } from '../db'
import { writeBackup, extractBackup } from '../backupCore'

const KEEP_AUTO_BACKUPS = 10

function backupsDir(): string {
  const dir = join(app.getPath('userData'), 'backups')
  mkdirSync(dir, { recursive: true })
  return dir
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function collectMediaPaths(): string[] {
  const row = getDb().prepare("SELECT portrait_path FROM character WHERE id='local'").get() as { portrait_path: string } | undefined
  return row?.portrait_path ? [row.portrait_path] : []
}

// One quiet database snapshot per day — a character is hours of setup, and a
// corrupt file or a bad update shouldn't be able to take it.
export async function runAutoBackup(): Promise<void> {
  try {
    const dest = join(backupsDir(), `auto-${stamp()}.db`)
    if (!existsSync(dest)) await getDb().backup(dest)
    const files = readdirSync(backupsDir()).filter((f) => f.startsWith('auto-') && f.endsWith('.db')).sort()
    for (const old of files.slice(0, Math.max(0, files.length - KEEP_AUTO_BACKUPS))) {
      try { unlinkSync(join(backupsDir(), old)) } catch { /* ignore */ }
    }
  } catch (e) {
    console.error('[backup] auto backup failed:', e)
  }
}

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:export', async () => {
    const pick = await dialog.showSaveDialog({
      title: 'Save character backup',
      defaultPath: join(app.getPath('documents'), `character-${stamp()}.lkbackup`),
      filters: [{ name: 'LoreKeeper backup', extensions: ['lkbackup'] }]
    })
    if (pick.canceled || !pick.filePath) return { ok: false, canceled: true }

    const tmp = join(app.getPath('temp'), `lkc-snapshot-${Date.now()}.db`)
    try {
      await getDb().backup(tmp)
      writeBackup(pick.filePath, tmp, collectMediaPaths(), 'lorekeeper-companion')
      return { ok: true, path: pick.filePath }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    } finally {
      try { unlinkSync(tmp) } catch { /* already gone */ }
    }
  })

  // Restore from a backup file (e.g. on a new PC), then restart on that data.
  // The current character is saved aside first, never just discarded.
  ipcMain.handle('backup:import', async () => {
    const pick = await dialog.showOpenDialog({
      title: 'Restore a character backup',
      properties: ['openFile'],
      filters: [{ name: 'LoreKeeper backup', extensions: ['lkbackup'] }]
    })
    if (pick.canceled || pick.filePaths.length === 0) return { ok: false, canceled: true }

    const userData = app.getPath('userData')
    const stagedDb = join(app.getPath('temp'), `lkc-restore-${Date.now()}.db`)
    try {
      const { manifest, pathMap } = extractBackup(pick.filePaths[0], stagedDb, join(userData, 'portraits'))
      if (manifest.app !== 'lorekeeper-companion') {
        return { ok: false, error: 'That backup is from the DM app, not the player app.' }
      }
      const staged = new Database(stagedDb)
      try {
        const stmt = staged.prepare('UPDATE character SET portrait_path = ? WHERE portrait_path = ?')
        for (const [orig, now] of Object.entries(pathMap)) stmt.run(now, orig)
        staged.pragma('wal_checkpoint(TRUNCATE)')
      } finally {
        staged.close()
      }

      const live = join(userData, 'companion.db')
      await getDb().backup(join(backupsDir(), `before-restore-${Date.now()}.db`))
      closeDb()
      for (const suffix of ['', '-wal', '-shm']) {
        try { unlinkSync(live + suffix) } catch { /* may not exist */ }
      }
      copyFileSync(stagedDb, live)
      try { unlinkSync(stagedDb) } catch { /* ignore */ }

      app.relaunch()
      app.exit(0)
      return { ok: true }
    } catch (e) {
      try { unlinkSync(stagedDb) } catch { /* ignore */ }
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  })

  ipcMain.handle('backup:info', () => {
    const dir = backupsDir()
    const autos = readdirSync(dir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const st = statSync(join(dir, f))
        return { name: f, size: st.size, modified: st.mtimeMs }
      })
      .sort((a, b) => b.modified - a.modified)
    return { dir, autos }
  })

  ipcMain.handle('backup:openFolder', () => {
    shell.openPath(backupsDir())
  })
}
