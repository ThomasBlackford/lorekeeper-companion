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

export interface SyncStatus {
  connected: boolean
  connecting: boolean
  address: string | null
  error: string | null
}

const DEFAULT_PORT = 47337
const CONNECT_TIMEOUT_MS = 8000
const HEARTBEAT_MS = 15000
const RECONNECT_BASE_MS = 2000
const RECONNECT_MAX_MS = 30000

let ws: WebSocket | null = null
let address: string | null = null
let connected = false
let connecting = false
let lastError: string | null = null
let connectTimeout: ReturnType<typeof setTimeout> | null = null
let heartbeat: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempt = 0
// True once the player explicitly connected and hasn't explicitly
// disconnected — a dropped socket only auto-retries while this holds.
let wantConnected = false
let gotPong = true
const partyMessages: PartyChatMessage[] = []
const dmReplies: DmReply[] = []
let cachedClientId: string | null = null
let onOpenCallback: (() => void) | null = null
let commandHandler: ((cmd: Record<string, unknown>) => void) | null = null
let joinCode = ''

// Called whenever the socket finishes opening (a fresh connect, or the
// silent reconnect attempt on app launch) — used by the character IPC
// module to push an immediate snapshot so the DM sees this player right
// away instead of waiting for the next sheet edit.
export function onConnected(cb: () => void): void {
  onOpenCallback = cb
}

// Everything the DM pushes to this player (damage, rolls, handouts…) is handed
// to the character module, which applies it to the sheet and tells the UI.
export function onDmCommand(cb: (cmd: Record<string, unknown>) => void): void {
  commandHandler = cb
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

function sendToRenderer(channel: string, payload: unknown): void {
  const win = getMainWin()
  if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) win.webContents.send(channel, payload)
}

function pushStatus(): void {
  sendToRenderer('sync:status', getStatus())
}

export function getStatus(): SyncStatus {
  return { connected, connecting, address, error: lastError }
}

export function getPartyMessages(): PartyChatMessage[] {
  return partyMessages
}

export function getDmReplies(): DmReply[] {
  return dmReplies
}

// Turns the raw socket errors into something a player can act on — "ECONNREFUSED
// 192.168.1.5:47337" doesn't tell anyone that the DM probably hasn't pressed
// Start in Player Sync yet.
function friendlyError(err: unknown): string {
  const code = (err as NodeJS.ErrnoException)?.code
  const msg = err instanceof Error ? err.message : String(err)
  switch (code) {
    case 'ECONNREFUSED':
      return "The DM's PC refused the connection — make sure they've started Player Sync in LoreKeeper."
    case 'ETIMEDOUT':
    case 'EHOSTUNREACH':
    case 'ENETUNREACH':
      return "Couldn't reach that address — check you're both on the same WiFi network and the address is right."
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return "That address doesn't look right — use the numbers the DM's app shows, like 192.168.1.23:47337."
    default:
      return msg || 'Connection failed.'
  }
}

// Accepts what people actually paste: with or without ws://, a trailing
// slash, or no port at all. Returns null for something that can't be an address.
function normalizeAddress(input: string): string | null {
  const cleaned = input.trim().replace(/^wss?:\/\//i, '').replace(/\/.*$/, '')
  if (!cleaned) return null
  const withPort = /:\d+$/.test(cleaned) ? cleaned : `${cleaned}:${DEFAULT_PORT}`
  return /^[\w.-]+:\d{1,5}$/.test(withPort) ? withPort : null
}

function clearTimers(): void {
  if (connectTimeout) { clearTimeout(connectTimeout); connectTimeout = null }
  if (heartbeat) { clearInterval(heartbeat); heartbeat = null }
}

// Tears down the current socket WITHOUT ever letting an unhandled 'error'
// event escape. `ws` emits 'error' asynchronously when a socket still
// CONNECTING is closed ("WebSocket was closed before the connection was
// established"); with all listeners removed that event has no handler, and
// Node turns an unhandled 'error' event into an uncaught exception — which
// Electron surfaces as the "A JavaScript error occurred in the main process"
// dialog. Leaving a no-op listener attached makes it harmless.
function destroySocket(): void {
  clearTimers()
  const old = ws
  ws = null
  if (!old) return
  old.removeAllListeners()
  old.on('error', () => {})
  try {
    if (old.readyState === WebSocket.CONNECTING) old.terminate()
    else old.close()
  } catch {
    /* already gone */
  }
}

function scheduleReconnect(): void {
  if (!wantConnected || !address || reconnectTimer) return
  const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** reconnectAttempt)
  reconnectAttempt++
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (wantConnected && address) open(address)
  }, delay)
}

function handleDown(reason?: string): void {
  const wasConnected = connected
  connected = false
  connecting = false
  clearTimers()
  ws = null
  if (reason) lastError = reason
  else if (wasConnected && !lastError) lastError = 'Connection to the DM was lost — retrying…'
  pushStatus()
  scheduleReconnect()
}

function open(addr: string): void {
  destroySocket()
  connecting = true
  connected = false
  pushStatus()

  let sock: WebSocket
  try {
    sock = new WebSocket(`ws://${addr}`)
  } catch (e) {
    handleDown(friendlyError(e))
    return
  }
  ws = sock

  // A blocked port (Windows Firewall on the DM's PC, different subnets) can
  // hang in "connecting" instead of failing fast — don't sit there forever.
  connectTimeout = setTimeout(() => {
    if (ws === sock && sock.readyState === WebSocket.CONNECTING) {
      destroySocket()
      handleDown(
        "Couldn't reach the DM's app after 8 seconds — check you're both on the same WiFi, the address is right, and Windows Firewall on the DM's PC allows LoreKeeper."
      )
    }
  }, CONNECT_TIMEOUT_MS)

  sock.on('open', () => {
    if (ws !== sock) return
    clearTimers()
    connected = true
    connecting = false
    lastError = null
    reconnectAttempt = 0
    gotPong = true
    // Identify ourselves first — a DM running with a join code ignores
    // everything that arrives before a valid hello.
    try {
      sock.send(JSON.stringify({ type: 'hello', code: joinCode, clientId: getClientId(), protocol: 2 }))
    } catch { /* close handler deals with it */ }
    // Persist the address (and code) only once the socket has actually
    // opened, so a typo never overwrites the last good one and the silent
    // reconnect on next launch uses known-good details.
    try {
      getDb().prepare("UPDATE character SET dm_server_address=?, dm_join_code=? WHERE id='local'").run(addr, joinCode)
    } catch { /* non-fatal */ }
    heartbeat = setInterval(() => {
      if (ws !== sock) return
      // No pong since the last ping → the other side is gone (laptop slept,
      // WiFi dropped) even though TCP hasn't noticed yet.
      if (!gotPong) { sock.terminate(); return }
      gotPong = false
      try { sock.ping() } catch { /* handled by close */ }
    }, HEARTBEAT_MS)
    pushStatus()
    try { onOpenCallback?.() } catch (e) { console.error('[sync] onConnected failed:', e) }
  })

  sock.on('pong', () => { gotPong = true })

  sock.on('close', (code, reason) => {
    if (ws !== sock) return
    // 4001 = the DM refused us (wrong or missing join code). Retrying with the
    // same code would just be refused again, so stop and say why.
    if (code === 4001) {
      wantConnected = false
      handleDown(reason.toString() || 'The DM refused the connection — check the join code.')
      return
    }
    handleDown()
  })

  sock.on('error', (err) => {
    if (ws !== sock) return
    // 'close' follows an 'error'; record the reason now so handleDown keeps it.
    lastError = friendlyError(err)
  })

  sock.on('message', (raw) => {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    if (!msg || typeof msg !== 'object') return
    if (msg.type === 'auth_failed') {
      wantConnected = false
      lastError = typeof msg.reason === 'string' ? msg.reason : 'The DM refused the connection — check the join code.'
      return // the close that follows reports it
    }
    if (msg.type === 'dm_command') {
      try { commandHandler?.(msg) } catch (e) { console.error('[sync] command failed:', e) }
      return
    }
    if (msg.type === 'party_message' && typeof msg.text === 'string' && typeof msg.from === 'string') {
      const entry: PartyChatMessage = { from: msg.from, text: msg.text, at: Number(msg.at) || Date.now() }
      partyMessages.push(entry)
      sendToRenderer('sync:partyMessage', entry)
    } else if (msg.type === 'dm_reply' && typeof msg.text === 'string') {
      const entry: DmReply = { text: msg.text, at: Number(msg.at) || Date.now() }
      dmReplies.push(entry)
      sendToRenderer('sync:dmReply', entry)
    }
  })
}

export function connect(addr: string, code = ''): { ok: boolean; error?: string } {
  joinCode = code.trim().toUpperCase()
  const normalized = normalizeAddress(addr)
  if (!normalized) {
    lastError = 'Enter the DM\'s address like 192.168.1.23:47337.'
    pushStatus()
    return { ok: false, error: lastError }
  }
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  reconnectAttempt = 0
  address = normalized
  wantConnected = true
  lastError = null
  open(normalized)
  return { ok: true }
}

export function disconnect(): void {
  wantConnected = false
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  destroySocket()
  connected = false
  connecting = false
  lastError = null
  pushStatus()
}

function sendRaw(payload: Record<string, unknown>): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ ...payload, clientId: getClientId() }))
    } catch (e) {
      console.error('[sync] send failed:', e)
    }
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

export function sendRollResult(payload: {
  rollId?: string; label: string; total: number; natural: number; modifier: number; dc?: number | null
}): void {
  sendRaw({ type: 'roll_result', ...payload })
}

export function sendCommandAck(id: string, ok: boolean, summary: string): void {
  sendRaw({ type: 'command_ack', id, ok, summary })
}

export function isConnected(): boolean {
  return connected
}

// Used by the silent reconnect on launch, which reads the saved details.
export function setJoinCode(code: string): void {
  joinCode = code.trim().toUpperCase()
}

// Exposed so the character module can send to renderer without importing electron windows.
export { sendToRenderer }
