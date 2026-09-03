import { useState, useEffect } from 'react'
import { MessageSquare, X, Send, Wifi, WifiOff } from 'lucide-react'
import type { Character, PartyChatMessage, SyncStatus } from '../types'

interface Props {
  character: Character
  onUpdate: (c: Character) => void
}

type ChatTab = 'party' | 'dm'
type DmThreadEntry = { from: 'you' | 'dm'; text: string; at: number }

// Global, floating in the bottom-right corner of the whole app — connection
// status/controls plus both conversations live here so the character sheet
// itself never has to make room for them.
export function ChatWidget({ character, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<ChatTab>('party')

  const [address, setAddress] = useState(character.dm_server_address)
  const [status, setStatus] = useState<SyncStatus>({ connected: false, address: null, error: null })
  const [connecting, setConnecting] = useState(false)

  const [partyMessages, setPartyMessages] = useState<PartyChatMessage[]>([])
  const [partyText, setPartyText] = useState('')
  const [seenParty, setSeenParty] = useState(0)

  const [dmText, setDmText] = useState('')
  const [dmThread, setDmThread] = useState<DmThreadEntry[]>([])
  const [seenDm, setSeenDm] = useState(0)

  useEffect(() => setAddress(character.dm_server_address), [character.dm_server_address])

  useEffect(() => {
    window.api.sync.status().then((s) => {
      setStatus({ connected: s.connected, address: s.address, error: s.error })
      setPartyMessages(s.messages)
      setDmThread(s.dmReplies.map((r) => ({ from: 'dm' as const, text: r.text, at: r.at })))
    })
    const cleanupStatus = window.api.sync.onStatus(setStatus)
    const cleanupMsg = window.api.sync.onPartyMessage((m) => setPartyMessages((prev) => [...prev, m]))
    const cleanupReply = window.api.sync.onDmReply((r) =>
      setDmThread((prev) => [...prev, { from: 'dm', text: r.text, at: r.at }])
    )
    return () => { cleanupStatus(); cleanupMsg(); cleanupReply() }
  }, [])

  function toggleOpen() {
    setOpen((v) => {
      const next = !v
      if (next) {
        setSeenParty(partyMessages.length)
        setSeenDm(dmThread.length)
      }
      return next
    })
  }

  async function handleConnect() {
    setConnecting(true)
    const result = await window.api.sync.connect(address)
    setConnecting(false)
    if (!result.ok) {
      alert(`Couldn't connect: ${result.error}`)
      return
    }
    const c = await window.api.character.save({ dm_server_address: address })
    onUpdate(c)
  }

  async function handleDisconnect() {
    await window.api.sync.disconnect()
  }

  async function sendDm() {
    if (!dmText.trim()) return
    await window.api.sync.sendDmMessage(dmText.trim())
    setDmThread((prev) => [...prev, { from: 'you', text: dmText.trim(), at: Date.now() }])
    setDmText('')
  }

  async function sendParty() {
    if (!partyText.trim()) return
    await window.api.sync.sendPartyMessage(partyText.trim())
    // The server relays to other players only, never back to the sender —
    // add our own line locally so it still shows up in our own log.
    setPartyMessages((prev) => [...prev, { from: 'You', text: partyText.trim(), at: Date.now() }])
    setPartyText('')
  }

  const unread = !open && (partyMessages.length > seenParty || dmThread.length > seenDm)

  return (
    <>
      <button
        onClick={toggleOpen}
        title="Chat"
        className="fixed bottom-4 right-4 z-40 w-11 h-11 flex items-center justify-center rounded-full
                   bg-surface-raised border border-border text-slate-400 shadow-lg
                   hover:text-amber-300 hover:border-amber-500/40 transition-colors"
      >
        <MessageSquare size={17} />
        {unread && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400" />}
      </button>

      {open && (
        <div className="fixed bottom-[4.75rem] right-4 z-40 w-80 max-h-[32rem] bg-surface-raised border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {status.connected ? <Wifi size={13} className="text-emerald-400" /> : <WifiOff size={13} className="text-slate-600" />}
              <h3 className="font-display text-sm font-semibold text-white">Sync</h3>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={15} />
            </button>
          </div>

          {!status.connected ? (
            <div className="p-3 border-b border-border flex-shrink-0 space-y-2">
              <input
                className="input text-xs py-1.5"
                placeholder="e.g. 192.168.1.23:47337"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
              <p className="text-[10px] text-slate-600">
                Ask the DM for this — it's shown in their app once they start Player Sync. You both need to be on
                the same WiFi network.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting || !address.trim()}
                className="btn-primary text-xs py-1.5 w-full disabled:opacity-40"
              >
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
              {status.error && <p className="text-[11px] text-red-400">{status.error}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0 text-[11px]">
              <span className="text-emerald-400">Connected · {status.address}</span>
              <button onClick={handleDisconnect} className="text-slate-500 hover:text-slate-300 transition-colors">
                Disconnect
              </button>
            </div>
          )}

          <div className="flex border-b border-border flex-shrink-0">
            <button
              onClick={() => setTab('party')}
              className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                tab === 'party' ? 'text-amber-300 border-amber-400' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Party Chat
            </button>
            <button
              onClick={() => setTab('dm')}
              className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                tab === 'dm' ? 'text-amber-300 border-amber-400' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Message DM
              {dmThread.length > seenDm && !open && <span className="ml-1 text-amber-400">•</span>}
            </button>
          </div>

          {tab === 'party' ? (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[12rem]">
                {partyMessages.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-8">No party messages yet. Hidden from the DM.</p>
                ) : (
                  partyMessages.map((m, i) => (
                    <p key={i} className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-sky-300 font-medium">{m.from}:</span> {m.text}
                    </p>
                  ))
                )}
              </div>
              <div className="flex items-center gap-1.5 p-2.5 border-t border-border flex-shrink-0">
                <input
                  className="input text-xs py-1.5"
                  placeholder="Message the party…"
                  value={partyText}
                  onChange={(e) => setPartyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendParty()}
                  disabled={!status.connected}
                />
                <button
                  onClick={sendParty}
                  disabled={!status.connected}
                  className="text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0 disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[12rem]">
                {dmThread.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-8">Nothing yet. Only you and the DM can see this.</p>
                ) : (
                  dmThread.map((m, i) => (
                    <p
                      key={i}
                      className={`text-xs leading-relaxed ${m.from === 'dm' ? 'text-amber-300' : 'text-slate-300'}`}
                    >
                      <span className="font-medium">{m.from === 'dm' ? 'DM' : 'You'}:</span> {m.text}
                    </p>
                  ))
                )}
              </div>
              <div className="flex items-center gap-1.5 p-2.5 border-t border-border flex-shrink-0">
                <input
                  className="input text-xs py-1.5"
                  placeholder="Message the DM privately…"
                  value={dmText}
                  onChange={(e) => setDmText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendDm()}
                  disabled={!status.connected}
                />
                <button
                  onClick={sendDm}
                  disabled={!status.connected}
                  className="text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0 disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
