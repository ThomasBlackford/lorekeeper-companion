import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface State {
  error: Error | null
}

// Without this, any render-time exception (a malformed row, a bad edit)
// unmounts the entire tree and leaves a blank window with no way forward.
// The character is stored in the local database, not in this component
// state, so "Try again" is always safe and loses nothing.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[renderer] render error:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-raised border border-border rounded-xl p-6 text-center space-y-3">
          <h1 className="font-display text-lg font-semibold text-white">Something went wrong</h1>
          <p className="text-sm text-slate-400">
            Your character is saved — nothing was lost. Try again, and if it keeps happening, tell the DM what you
            were doing.
          </p>
          <pre className="text-[11px] text-red-300/80 bg-black/40 rounded-lg p-2 text-left overflow-auto max-h-32 whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <div className="flex justify-center gap-2 pt-1">
            <button className="btn-ghost text-sm" onClick={() => this.setState({ error: null })}>Try again</button>
            <button className="btn-primary text-sm" onClick={() => window.location.reload()}>Reload app</button>
          </div>
        </div>
      </div>
    )
  }
}
