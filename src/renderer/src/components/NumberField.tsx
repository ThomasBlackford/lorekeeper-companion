import { useEffect, useState } from 'react'

interface Props {
  value: number
  onCommit: (v: number) => void
  min?: number
  max?: number
  className?: string
  title?: string
}

// A number input that keeps what you're typing locally and only saves on
// blur/Enter. A controlled <input type="number"> wired straight to the
// database fights the keyboard: clearing the field to type a new score
// instantly "commits" 0 (and re-renders "0" back into the box), so "16"
// becomes "016", and every keystroke fires a save + a sync to the DM.
export function NumberField({ value, onCommit, min, max, className = '', title }: Props) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  function commit() {
    let n = parseInt(text, 10)
    if (isNaN(n)) {
      setText(String(value)) // blank/garbage → put the old value back
      return
    }
    if (min != null) n = Math.max(min, n)
    if (max != null) n = Math.min(max, n)
    setText(String(n))
    if (n !== value) onCommit(n)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      title={title}
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^0-9-]/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') { setText(String(value)); (e.target as HTMLInputElement).blur() }
      }}
      onFocus={(e) => e.target.select()}
    />
  )
}
