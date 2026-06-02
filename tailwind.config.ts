import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'serif'],
      },
      colors: {
        sand:     'var(--sand)',
        cream:    'var(--cream)',
        ink:      'var(--ink)',
        mapbg:    'var(--map-bg)',
        muted:    'var(--muted)',
        coral:    'var(--coral)',
        gold:     'var(--gold)',
        forest:   'var(--forest)',
        mint:     'var(--mint)',
        amber:    'var(--amber)',
        lavender: 'var(--lavender)',
        sky:      'var(--sky)',
      },
    },
  },
  plugins: [],
}
export default config
