import { Moon, Sun } from 'lucide-react'

interface Props {
  onShortRest: () => void
  onLongRest: () => void
}

export function RestButtons({ onShortRest, onLongRest }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onShortRest}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm
                   border border-border text-slate-300 hover:border-slate-500 transition-colors"
      >
        <Sun size={14} /> Short Rest
      </button>
      <button
        onClick={onLongRest}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm
                   bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
      >
        <Moon size={14} /> Long Rest
      </button>
    </div>
  )
}
