import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface Props {
  values: string[]
  onChange: (values: string[]) => void
  presets?: string[]
  placeholder?: string
}

// Freeform chip list with optional "quick add" presets — used for every
// proficiency/language list (armor, weapons, tools, languages). Presets are
// just entries in the same array typed for you; once added they render as a
// normal removable chip like anything the player typed by hand.
export function TagInput({ values, onChange, presets, placeholder }: Props) {
  const [text, setText] = useState('')

  function add(value: string) {
    const v = value.trim()
    if (!v || values.includes(v)) return
    onChange([...values, v])
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value))
  }

  function submit() {
    add(text)
    setText('')
  }

  const availablePresets = (presets ?? []).filter((p) => !values.includes(p))

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {values.length === 0 && <span className="text-[11px] text-slate-600 italic">None yet</span>}
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]"
          >
            {v}
            <button onClick={() => remove(v)} className="text-amber-400/60 hover:text-amber-200 transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          className="input text-xs py-1 flex-1 min-w-[140px]"
          placeholder={placeholder ?? 'Add…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button
          onClick={submit}
          title="Add"
          className="p-1.5 rounded border border-border text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
        >
          <Plus size={12} />
        </button>
        {availablePresets.map((p) => (
          <button
            key={p}
            onClick={() => add(p)}
            className="px-2 py-1 rounded-full border border-dashed border-border text-[11px] text-slate-500 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
          >
            + {p}
          </button>
        ))}
      </div>
    </div>
  )
}
