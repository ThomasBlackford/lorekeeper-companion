import { useCallback, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface Request {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
  onYes: () => void
}

// `const { ask, dialog } = useConfirm()` — render `{dialog}` anywhere in the
// component and call `ask({ title, ... })` where a confirm() used to be.
export function useConfirm() {
  const [req, setReq] = useState<Request | null>(null)

  const ask = useCallback((r: Request) => setReq(r), [])

  const dialog = req ? (
    <ConfirmDialog
      title={req.title}
      message={req.message}
      confirmLabel={req.confirmLabel}
      danger={req.danger}
      onCancel={() => setReq(null)}
      onConfirm={() => {
        const run = req.onYes
        setReq(null)
        run()
      }}
    />
  ) : null

  return { ask, dialog }
}
