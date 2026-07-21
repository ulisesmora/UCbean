import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-body)',    'system-ui', 'sans-serif'],
        body:    ['var(--font-body)',    'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia',   'serif'],
      },
      colors: {
        // Warm birch/cream — backgrounds
        birch: {
          50:  '#f7f3ed',
          100: '#ede6d6',
          200: '#ddd5c4',
          300: '#c9bda8',
        },
        // Canadian forest greens — primary actions
        forest: {
          50:  '#edf3ee',
          100: '#cfe0d2',
          300: '#7aaa82',
          500: '#4a7d52',
          600: '#3a6642',
          700: '#2d5235',
          800: '#1e3a26',
          900: '#12251a',
        },
        // Bark/warm brown — serif accents, secondary
        bark: {
          300: '#c4a882',
          400: '#a88660',
          500: '#8b6f47',
          700: '#6b4f2a',
          900: '#3d2810',
        },
        // Stone — muted text, borders
        stone2: {
          400: '#9a9285',
          600: '#6b6358',
          900: '#1e1208',
        },
      },
    },
  },
  plugins: [],
}

export default config
