// Tiny pub/sub for user-visible error messages, so any code path (including
// the global unhandled-rejection hook) can surface a failure without needing
// a component handle.
export type NotifyKind = 'error' | 'info'
type Listener = (message: string, kind: NotifyKind) => void
const listeners = new Set<Listener>()

export function onNotify(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function notifyError(err: unknown, prefix = 'Something went wrong'): void {
  const detail = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  // Electron wraps IPC failures as "Error invoking remote method 'x': Error: …" — keep just the useful tail.
  const cleaned = detail.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '')
  const message = cleaned ? `${prefix}: ${cleaned}` : prefix
  console.error('[notify]', err)
  listeners.forEach((l) => l(message, 'error'))
}

// A neutral heads-up ("The DM granted you Inspiration", "+50 XP").
export function notifyInfo(message: string): void {
  listeners.forEach((l) => l(message, 'info'))
}
