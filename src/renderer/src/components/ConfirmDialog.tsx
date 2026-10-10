import { ModalShell } from './ModalShell'

interface Props {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// In-app replacement for window.confirm(). On Windows, Electron's native
// confirm/alert dialogs are known to leave the page's text inputs unable to
// take focus afterwards (until the window is alt-tabbed away and back) —
// which reads as "the app froze." This is also styled like the rest of the app.
export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: Props) {
  return (
    <ModalShell onClose={onCancel} className="max-w-sm p-5">
      <h2 className="font-display text-base font-semibold text-white">{title}</h2>
      {message && <p className="text-sm text-slate-400 mt-2 leading-relaxed">{message}</p>}
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onCancel} className="btn-ghost text-sm py-1.5" autoFocus>Cancel</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger text-sm py-1.5' : 'btn-primary text-sm py-1.5'}>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  )
}
