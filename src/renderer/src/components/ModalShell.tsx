import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  onClose: () => void
  children: ReactNode
  className?: string
}

// Every popup goes through this. Two things it guarantees that a plain
// `fixed inset-0` div rendered inline does not:
//
// 1. It's portaled to <body>. Rows (`.row-interactive`) apply a transform on
//    :active, and a transformed ancestor becomes the containing block for
//    `position: fixed` descendants — and :active also matches every DOM
//    ancestor of the pressed element. So pressing a button inside a popup
//    that lived inside a row made the row transform, which moved the popup
//    out from under the cursor mid-click; mouseup then landed elsewhere, no
//    click fired, and the popup could not be closed.
// 2. Escape always closes it.
export function ModalShell({ onClose, children, className = '' }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="modal-backdrop"
      // Closing on mousedown of the scrim itself (not click) means a text
      // selection dragged out of the panel and released over the scrim
      // doesn't dismiss it.
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`modal ${className}`} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  )
}
