import { useEffect, useState } from 'react'
import { X, Download, Upload, FolderOpen } from 'lucide-react'
import type { ColorTheme, LayoutTheme, StyleTheme } from '../contexts/SettingsContext'
import { useSettings } from '../contexts/SettingsContext'
import { ModalShell } from './ModalShell'
import { useConfirm } from '../hooks/useConfirm'

interface Props {
  onClose: () => void
}

const STYLE_OPTIONS: { value: StyleTheme; label: string }[] = [
  { value: 'fantasy', label: 'Fantasy — serif headings' },
  { value: 'modern', label: 'Modern — sans-serif headings' }
]

const COLOR_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: 'crimson', label: 'Blood Red' },
  { value: 'amber', label: 'Gold' },
  { value: 'arcane', label: 'Violet' }
]

const LAYOUT_OPTIONS: { value: LayoutTheme; label: string }[] = [
  { value: 'single', label: 'Single column' },
  { value: 'wide', label: 'Two columns' }
]

function fmtSize(bytes: number): string {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function SettingsPanel({ onClose }: Props) {
  const { style, color, layout, setStyle, setColor, setLayout } = useSettings()
  const { ask, dialog } = useConfirm()
  const [backups, setBackups] = useState<{ name: string; size: number; modified: number }[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.api.backup.info().then((i) => setBackups(i.autos)).catch(() => {})
    window.api.app.version().then(setVersion).catch(() => {})
  }, [])

  async function handleExport() {
    setBusy(true)
    setMessage(null)
    const r = await window.api.backup.export()
    setBusy(false)
    if (r.canceled) return
    setMessage(r.ok ? { text: 'Character saved.' } : { text: r.error ?? 'Backup failed.', error: true })
  }

  function handleRestore() {
    ask({
      title: 'Restore from a backup?',
      message:
        'This replaces your character with the one in the backup file, then restarts the app. Your current character is saved aside first.',
      confirmLabel: 'Choose backup file…',
      danger: true,
      onYes: async () => {
        setBusy(true)
        const r = await window.api.backup.import()
        setBusy(false)
        if (!r.ok && !r.canceled) setMessage({ text: r.error ?? 'Restore failed.', error: true })
      }
    })
  }

  return (
    <ModalShell onClose={onClose} className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold text-white uppercase tracking-widest">Settings</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-medium">Theme</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Heading font</label>
            <select className="input text-sm" value={style} onChange={(e) => setStyle(e.target.value as StyleTheme)}>
              {STYLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Color</label>
            <select className="input text-sm" value={color} onChange={(e) => setColor(e.target.value as ColorTheme)}>
              {COLOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Layout</label>
          <select className="input text-sm" value={layout} onChange={(e) => setLayout(e.target.value as LayoutTheme)}>
            {LAYOUT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3 mt-7 pt-5 border-t border-border">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-medium">Backup &amp; restore</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your character lives only on this PC. Save a copy somewhere safe — and use it to move to a new computer.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleExport} disabled={busy} className="btn-primary flex items-center justify-center gap-2 text-xs disabled:opacity-50">
            <Download size={13} /> Back up now
          </button>
          <button onClick={handleRestore} disabled={busy} className="btn-ghost border-border flex items-center justify-center gap-2 text-xs disabled:opacity-50">
            <Upload size={13} /> Restore…
          </button>
        </div>
        {message && <p className={`text-xs ${message.error ? 'text-red-400' : 'text-emerald-400'}`}>{message.text}</p>}

        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-slate-400">Automatic daily snapshots</p>
            <button
              onClick={() => window.api.backup.openFolder()}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-white transition-colors"
            >
              <FolderOpen size={11} /> Open folder
            </button>
          </div>
          {backups.length === 0 ? (
            <p className="text-[11px] text-slate-600">None yet — the first is taken when the app starts.</p>
          ) : (
            <ul className="space-y-0.5">
              {backups.slice(0, 4).map((b) => (
                <li key={b.name} className="flex justify-between text-[11px] text-slate-600">
                  <span>{new Date(b.modified).toLocaleString()}</span>
                  <span>{fmtSize(b.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {version && <p className="mt-6 text-[10px] uppercase tracking-widest text-slate-700 text-right">LoreKeeper Companion v{version}</p>}
      {dialog}
    </ModalShell>
  )
}
