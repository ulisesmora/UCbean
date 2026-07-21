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
        // Warm oat/cream — backgrounds
        birch: {
          50:  '#faf7f1',
          100: '#f0e9da',
          200: '#e3d5c0',
          300: '#d0bfa4',
        },
        // Dusty sage — primary actions (organic biophilic, NOT Starbucks green)
        forest: {
          50:  '#eff4ed',
          100: '#d8e8d3',
          300: '#9fc49a',
          500: '#6ea864',
          600: '#548a49',
          700: '#406c37',
          800: '#2b4924',
          900: '#1c100a',
        },
        // Warm clay — serif accents, secondary
        bark: {
          300: '#d4ba98',
          400: '#c49868',
          500: '#a87c4a',
          700: '#7c5a2e',
          900: '#452e14',
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
