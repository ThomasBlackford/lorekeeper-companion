import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/src/**/*.{ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#0d1117',
          raised: '#161b27',
          overlay: '#1e2436'
        },
        border: '#2a3050',
        accent: {
          DEFAULT: '#c9a84c',
          hover: '#e0bc5c',
          muted: '#8a6f2e'
        },
        // Every "accent" highlight in this app (buttons, active tabs, links)
        // consistently uses the amber-300/400/500 shades — so overriding
        // just those three lets the whole app re-theme through one CSS
        // variable each, with no component changes. Other amber shades
        // (e.g. the fixed condition-badge colors) are left as Tailwind's
        // real amber and don't shift with the theme.
        //
        // rgb(var(--x) / <alpha-value>) is Tailwind's documented pattern for
        // CSS-variable colors — it's what lets opacity modifiers like
        // amber-500/20 keep working. The variables hold space-separated RGB
        // channels (not hex), which is what that syntax requires.
        amber: {
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      // Same trick as the color override — `rounded-xl`/`rounded-lg` are
      // used throughout for cards/inputs, so wiring the scale itself to a
      // variable makes the "Style" setting affect the whole app.
      borderRadius: {
        xl: 'var(--radius-card, 0.75rem)',
        lg: 'var(--radius-input, 0.5rem)'
      }
    }
  },
  plugins: []
} satisfies Config
