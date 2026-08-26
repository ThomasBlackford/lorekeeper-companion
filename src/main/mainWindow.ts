import type { BrowserWindow } from 'electron'

// Tracked separately from index.ts so other main-process modules (like the
// sync client) can push to the renderer without an import cycle back into
// the app's entry point.
let win: BrowserWindow | null = null

export function setMainWin(w: BrowserWindow): void {
  win = w
}

export function getMainWin(): BrowserWindow | null {
  return win
}
