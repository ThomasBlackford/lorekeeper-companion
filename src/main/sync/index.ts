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

const CONNECT_TIMEOUT_MS = 8000

let ws: WebSocket | null = null
let address: string | null = null
let connected = false
let lastError: string | null = null
let connectTimeout: ReturnType<typeof setTimeout> | null = null
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
  // Tolerate the DM's address pasted with a scheme or trailing slash — easy
  // mistakes when copying it out of the chat widget ("ws://192.168.1.5:47337/").
  address = addr.trim().replace(/^wss?:\/\//i, '').replace(/\/+$/, '')

  try {
    ws = new WebSocket(`ws://${address}`)
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e)
    ws = null
    pushStatus()
    return { ok: false, error: lastError }
  }

  // A blocked port (Windows Firewall on the DM's PC, different subnets,
  // wrong address) doesn't always raise a socket error — it can just hang in
  // "connecting" forever. Without this, the app would sit on "Connecting…"
  // indefinitely instead of ever telling the player something's wrong.
  connectTimeout = setTimeout(() => {
    if (ws && ws.readyState === WebSocket.CONNECTING) {
      lastError =
        "Couldn't reach the DM's app after 8 seconds — check you're both on the same WiFi network, the address is correct, and Windows Firewall on the DM's PC allows LoreKeeper."
      ws.terminate()
    }
  }, CONNECT_TIMEOUT_MS)

  ws.on('open', () => {
    if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null }
    connected = true
    lastError = null
    pushStatus()
    onOpenCallback?.()
  })

  ws.on('close', () => {
    if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null }
    connected = false
    pushStatus()
  })

  ws.on('error', (err) => {
    if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null }
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
  if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null }
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
