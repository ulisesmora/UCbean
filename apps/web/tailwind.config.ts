import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Around the Bean — white brutalism.
 *
 * Paper-white ground, black structure, forest neon used as mass rather than as
 * ink. Presence comes from weight and edge, not from glow.
 *
 * Contrast rule that shapes this whole palette: #A9C23F on white is about
 * 1.7:1, so the green is a FILL only and always carries near-black text, where
 * it reaches 12:1. Green as type on white uses forest-700 (#55681A, 5.8:1).
 *
 * The birch/forest/bark/stone2 names are kept on purpose: every page already
 * speaks them, so redefining the values flips the whole site instead of forcing
 * an edit in each file. Read them as roles, not as colours.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        seal: ['var(--font-seal)', 'var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Paper. The page is white and stays white.
        birch: {
          50: '#FFFFFF',
          100: '#F5F5F2',
          200: '#E2E2DC',
          300: '#0A0A0A', // structural rule — brutalism draws its lines in ink
        },
        // Forest neon. 700 is the only member safe as type on white.
        forest: {
          50: '#F5F8E9',
          100: '#E7EFC6',
          300: '#A9C23F',
          500: '#A9C23F',
          600: '#8CA32E',
          700: '#55681A',
          800: '#3F4D13',
          900: '#2C3609',
        },
        // Ember, the second accent. 700 is the type-safe member.
        bark: {
          300: '#FFD9C7',
          400: '#FF7A42',
          500: '#FF5A18',
          700: '#A83700',
          900: '#3D1400',
        },
        stone2: {
          400: '#8A8A82',
          600: '#4A4A45',
          900: '#0A0A0A',
        },
        neon: {
          400: '#C8DC72',
          500: '#A9C23F', // fill only
          600: '#8CA32E',
          700: '#55681A', // type-safe on white
        },
        seal: {
          50: '#FFEDE6',
          300: '#FFB79B',
          500: '#FF5A18',
          600: '#D94400',
          700: '#A83700',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      // Brutalism does not round things off.
      borderRadius: { sm: '0px', md: '0px', lg: '0px', xl: '0px', '2xl': '0px', '3xl': '0px' },
      borderWidth: { 3: '3px' },
      boxShadow: {
        // Offset slab, the brutalist signature. Ink, not glow.
        hard: '6px 6px 0 0 #0A0A0A',
        'hard-lg': '10px 10px 0 0 #0A0A0A',
        'hard-neon': '6px 6px 0 0 #A9C23F',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(3%, -2%, 0) scale(1.06)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        drift: 'drift 24s ease-in-out infinite',
        rise: 'rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [animate],
};

export default config;
