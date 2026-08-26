import type { Condition } from '../types'

// Ported from the DM app's encounter tracker (src/renderer/src/components/encounter/ConditionBadge.tsx)
// so a condition looks the same whether you're seeing it on the DM's
// screen or your own — same list, same colors.
export const ALL_CONDITIONS: Condition[] = [
  'Blinded', 'Charmed', 'Deafened', 'Exhausted', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
]

const CONDITION_COLORS: Record<Condition, string> = {
  Blinded:       'bg-slate-600 text-slate-200',
  Charmed:       'bg-pink-700 text-pink-100',
  Deafened:      'bg-slate-500 text-slate-200',
  Exhausted:     'bg-orange-800 text-orange-100',
  Frightened:    'bg-yellow-700 text-yellow-100',
  Grappled:      'bg-teal-700 text-teal-100',
  Incapacitated: 'bg-red-800 text-red-100',
  Invisible:     'bg-indigo-700 text-indigo-100',
  Paralyzed:     'bg-purple-800 text-purple-100',
  Petrified:     'bg-stone-600 text-stone-100',
  Poisoned:      'bg-green-800 text-green-100',
  Prone:         'bg-amber-700 text-amber-100',
  Restrained:    'bg-cyan-800 text-cyan-100',
  Stunned:       'bg-violet-700 text-violet-100',
  Unconscious:   'bg-gray-800 text-gray-200',
}

interface BadgeProps {
  condition: Condition
  onRemove?: () => void
}

export function ConditionBadge({ condition, onRemove }: BadgeProps) {
  const colors = CONDITION_COLORS[condition]
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${colors}`}
      title={condition}
    >
      {condition}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="opacity-60 hover:opacity-100 leading-none"
        >
          ×
        </button>
      )}
    </span>
  )
}

interface PickerProps {
  active: Condition[]
  onToggle: (c: Condition) => void
  onClose: () => void
}

export function ConditionPicker({ active, onToggle, onClose }: PickerProps) {
  return (
    <div
      className="absolute z-50 top-full left-0 mt-1 p-2 bg-surface-overlay border border-border rounded-lg shadow-xl w-52"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-2 gap-1">
        {ALL_CONDITIONS.map((c) => {
          const isActive = active.includes(c)
          return (
            <button
              key={c}
              onClick={() => onToggle(c)}
              className={`text-left px-2 py-1 rounded text-xs transition-colors ${
                isActive
                  ? `${CONDITION_COLORS[c]} ring-1 ring-white/20`
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-2 w-full text-xs text-slate-500 hover:text-slate-300 text-center"
      >
        Close
      </button>
    </div>
  )
}
