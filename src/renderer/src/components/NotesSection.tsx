import { useState, useEffect } from 'react'

interface Props {
  notes: string
  onChange: (notes: string) => void
}

export function NotesSection({ notes, onChange }: Props) {
  const [text, setText] = useState(notes)
  useEffect(() => setText(notes), [notes])

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-4">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-3">Notes</h2>
      <textarea
        className="input resize-none text-sm"
        rows={6}
        placeholder="Session notes, reminders, plans…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(text)}
      />
    </div>
  )
}
