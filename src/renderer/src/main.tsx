import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App } from './App'
import { SettingsProvider } from './contexts/SettingsContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { notifyError } from './lib/notify'
import { RollProvider } from './contexts/RollContext'

// An IPC call that rejects (DB error, bad payload) otherwise vanishes into the
// console and leaves the UI looking like nothing happened.
window.addEventListener('unhandledrejection', (e) => {
  e.preventDefault()
  notifyError(e.reason, "Couldn't complete that")
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <RollProvider>
          <App />
        </RollProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
