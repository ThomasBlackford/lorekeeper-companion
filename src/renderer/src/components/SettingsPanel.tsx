import { X } from 'lucide-react'
import type { ColorTheme, LayoutTheme, StyleTheme } from '../contexts/SettingsContext'
import { useSettings } from '../contexts/SettingsContext'

interface Props {
  onClose: () => void
}

const STYLE_OPTIONS: { value: StyleTheme; label: string }[] = [
  { value: 'fantasy', label: 'Fantasy — serif headers, rounded cards' },
  { value: 'modern', label: 'Modern — sans-serif, sharper corners' }
]

const COLOR_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: 'amber', label: 'Amber' },
  { value: 'crimson', label: 'Crimson' },
  { value: 'arcane', label: 'Arcane (violet)' }
]

const LAYOUT_OPTIONS: { value: LayoutTheme; label: string }[] = [
  { value: 'single', label: 'Single Column' },
  { value: 'wide', label: 'Wide — two column' }
]

export function SettingsPanel({ onClose }: Props) {
  const { style, color, layout, setStyle, setColor, setLayout } = useSettings()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium">Theme</h3>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Style</label>
            <select className="input text-sm" value={style} onChange={(e) => setStyle(e.target.value as StyleTheme)}>
              {STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Color</label>
            <select className="input text-sm" value={color} onChange={(e) => setColor(e.target.value as ColorTheme)}>
              {COLOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Layout</label>
            <select className="input text-sm" value={layout} onChange={(e) => setLayout(e.target.value as LayoutTheme)}>
              {LAYOUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
