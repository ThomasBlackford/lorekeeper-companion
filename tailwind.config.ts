import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default {
  content: ['./src/renderer/src/**/*.{ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#040102',
          raised: '#0d0607',
          overlay: '#160a0c'
        },
        border: '#2e1519',
        // Warm neutrals instead of Tailwind's blue-tinted slate, so body text
        // and muted greys sit naturally on the red/black surfaces.
        slate: colors.stone,
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
        // Sharp, squared-off UI everywhere. Only rounded-full (avatars, pips,
        // status dots) keeps its curve, since a square dot reads as a bug.
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0'
      },
      // Tailwind's `transition-colors`/`transition-all`/etc. default to
      // 150ms with no `duration-*` suffix — nearly every hover/focus state
      // in the app uses one of those bare. Overriding the DEFAULT here (not
      // adding a new scale step) makes all of them 500ms app-wide from this
      // one line, instead of hunting down every occurrence individually.
      transitionDuration: {
        DEFAULT: '500ms'
      }
    }
  },
  plugins: []
} satisfies Config
