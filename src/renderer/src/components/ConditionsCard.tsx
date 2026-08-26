import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import type { Condition } from '../types'
import { ConditionBadge, ConditionPicker } from './ConditionBadge'

interface Props {
  conditions: Condition[]
  onChange: (conditions: Condition[]) => void
}

export function ConditionsCard({ conditions, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPicker) return
    function onDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showPicker])

  function toggle(c: Condition) {
    onChange(conditions.includes(c) ? conditions.filter((x) => x !== c) : [...conditions, c])
  }

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-4">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-3">Conditions</h2>
      <div className="relative flex flex-wrap items-center gap-1.5" ref={pickerRef}>
        {conditions.map((c) => (
          <ConditionBadge key={c} condition={c} onRemove={() => toggle(c)} />
        ))}
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
        {showPicker && (
          <ConditionPicker active={conditions} onToggle={toggle} onClose={() => setShowPicker(false)} />
        )}
      </div>
    </div>
  )
}
