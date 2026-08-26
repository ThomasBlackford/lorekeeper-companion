import WebSocket from 'ws'
import { getMainWin } from '../mainWindow'
import { getDb } from '../db'

export interface PartyChatMessage {
  from: string
  text: string
  at: number
}

export interface DmReply {
  text: string
  at: number
}

let ws: WebSocket | null = null
let address: string | null = null
let connected = false
let lastError: string | null = null
const partyMessages: PartyChatMessage[] = []
const dmReplies: DmReply[] = []
let cachedClientId: string | null = null
let onOpenCallback: (() => void) | null = null

// Called whenever the socket finishes opening (a fresh connect, or the
// silent reconnect attempt on app launch) — used by the character IPC
// module to push an immediate snapshot so the DM sees this player right
// away instead of waiting for the next sheet edit.
export function onConnected(cb: () => void): void {
  onOpenCallback = cb
}

function getClientId(): string {
  if (!cachedClientId) {
    const row = getDb().prepare("SELECT client_id FROM character WHERE id='local'").get() as
      | { client_id: string }
      | undefined
    cachedClientId = row?.client_id ?? ''
  }
  return cachedClientId
}

function pushStatus(): void {
  getMainWin()?.webContents.send('sync:status', getStatus())
}

export function getStatus(): { connected: boolean; address: string | null; error: string | null } {
  return { connected, address, error: lastError }
}

export function getPartyMessages(): PartyChatMessage[] {
  return partyMessages
}

export function getDmReplies(): DmReply[] {
  return dmReplies
}

export function connect(addr: string): { ok: boolean; error?: string } {
  disconnect()
  address = addr.trim()

  try {
    ws = new WebSocket(`ws://${address}`)
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e)
    ws = null
    pushStatus()
    return { ok: false, error: lastError }
  }

  ws.on('open', () => {
    connected = true
    lastError = null
    pushStatus()
    onOpenCallback?.()
  })

  ws.on('close', () => {
    connected = false
    pushStatus()
  })

  ws.on('error', (err) => {
    lastError = err instanceof Error ? err.message : String(err)
    connected = false
    pushStatus()
  })

  ws.on('message', (raw) => {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    if (msg.type === 'party_message' && typeof msg.text === 'string' && typeof msg.from === 'string') {
      const entry: PartyChatMessage = { from: msg.from, text: msg.text, at: Number(msg.at) || Date.now() }
      partyMessages.push(entry)
      getMainWin()?.webContents.send('sync:partyMessage', entry)
    } else if (msg.type === 'dm_reply' && typeof msg.text === 'string') {
      const entry: DmReply = { text: msg.text, at: Number(msg.at) || Date.now() }
      dmReplies.push(entry)
      getMainWin()?.webContents.send('sync:dmReply', entry)
    }
  })

  return { ok: true }
}

export function disconnect(): void {
  if (ws) {
    ws.removeAllListeners()
    ws.close()
  }
  ws = null
  connected = false
  pushStatus()
}

function sendRaw(payload: Record<string, unknown>): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ...payload, clientId: getClientId() }))
  }
}

export function sendSnapshot(data: unknown): void {
  sendRaw({ type: 'snapshot', data })
}

export function sendDmMessage(text: string): void {
  sendRaw({ type: 'dm_message', text })
}

export function sendPartyMessage(text: string): void {
  sendRaw({ type: 'party_message', text })
}
