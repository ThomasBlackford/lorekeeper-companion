import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type StyleTheme = 'fantasy' | 'modern'
export type ColorTheme = 'amber' | 'crimson' | 'arcane'
export type LayoutTheme = 'single' | 'wide'

interface Settings {
  style: StyleTheme
  color: ColorTheme
  layout: LayoutTheme
}

const DEFAULT_SETTINGS: Settings = { style: 'fantasy', color: 'crimson', layout: 'wide' }
const STORAGE_KEY = 'lorekeeper-companion-settings'

interface SettingsContextValue extends Settings {
  setStyle: (v: StyleTheme) => void
  setColor: (v: ColorTheme) => void
  setLayout: (v: LayoutTheme) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

// The dark-red redesign replaced the old amber default. Anyone with a saved
// pre-redesign choice gets the new look once; they can pick another color after.
const THEME_VERSION = '2'
const THEME_VERSION_KEY = STORAGE_KEY + '-theme-version'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const saved = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    if (localStorage.getItem(THEME_VERSION_KEY) !== THEME_VERSION) {
      saved.color = DEFAULT_SETTINGS.color
      saved.layout = DEFAULT_SETTINGS.layout // the two-column sheet keeps the tabs on screen without scrolling past the vitals
    }
    return saved
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  // Reflect settings onto <html> as data attributes — that's what the CSS
  // variables in index.css key off of, and it survives independently of
  // which component tree is currently mounted.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    localStorage.setItem(THEME_VERSION_KEY, THEME_VERSION)
    document.documentElement.setAttribute('data-style', settings.style)
    document.documentElement.setAttribute('data-color', settings.color)
  }, [settings])

  const value: SettingsContextValue = {
    ...settings,
    setStyle: (style) => setSettings((s) => ({ ...s, style })),
    setColor: (color) => setSettings((s) => ({ ...s, color })),
    setLayout: (layout) => setSettings((s) => ({ ...s, layout }))
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}
