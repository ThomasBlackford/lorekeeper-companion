import { useState, useEffect } from 'react'
import type { Background } from '../types'
import { EMPTY_BACKGROUND } from '../types'

interface Props {
  background: Background
  onChange: (background: Background) => void
}

const CHAR_FIELDS: { key: keyof Background; label: string }[] = [
  { key: 'gender', label: 'Gender' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'size', label: 'Size' },
  { key: 'height', label: 'Height' },
  { key: 'faith', label: 'Faith' },
  { key: 'hair', label: 'Hair' },
  { key: 'skin', label: 'Skin' },
  { key: 'age', label: 'Age' },
  { key: 'weight', label: 'Weight' }
]

const PROSE_FIELDS: { key: keyof Background; label: string }[] = [
  { key: 'personality_traits', label: 'Personality Traits' },
  { key: 'ideals', label: 'Ideals' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'flaws', label: 'Flaws' }
]

export function BackgroundSection({ background, onChange }: Props) {
  const [local, setLocal] = useState<Background>({ ...EMPTY_BACKGROUND, ...background })

  useEffect(() => setLocal({ ...EMPTY_BACKGROUND, ...background }), [background])

  function set(key: keyof Background, value: string) {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  function commit() {
    onChange(local)
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          className="input text-sm mb-2"
          placeholder="Background (e.g. Sage, Soldier)"
          value={local.title}
          onChange={(e) => set('title', e.target.value)}
          onBlur={commit}
        />
        <textarea
          className="input resize-none text-xs"
          rows={3}
          placeholder="Description"
          value={local.description}
          onChange={(e) => set('description', e.target.value)}
          onBlur={commit}
        />
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">Characteristics</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {CHAR_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-[10px] text-slate-600 block mb-0.5">{f.label}</label>
              <input
                className="input text-xs py-1.5"
                value={local[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                onBlur={commit}
              />
            </div>
          ))}
        </div>
      </div>

      {PROSE_FIELDS.map((f) => (
        <div key={f.key}>
          <label className="text-xs text-slate-500 block mb-1">{f.label}</label>
          <textarea
            className="input resize-none text-xs"
            rows={2}
            value={local[f.key]}
            onChange={(e) => set(f.key, e.target.value)}
            onBlur={commit}
          />
        </div>
      ))}

      <div>
        <label className="text-xs text-slate-500 block mb-1">Appearance</label>
        <textarea
          className="input resize-none text-xs"
          rows={2}
          value={local.appearance}
          onChange={(e) => set('appearance', e.target.value)}
          onBlur={commit}
        />
      </div>
    </div>
  )
}
