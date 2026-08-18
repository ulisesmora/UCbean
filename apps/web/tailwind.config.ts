import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      // Brand palette (raw hex — used directly in JSX)
      colors: {
        birch: {
          50: '#faf7f1',
          100: '#f0e9da',
          200: '#e3d5c0',
          300: '#d0bfa4',
        },
        forest: {
          50: '#eff4ed',
          100: '#d8e8d3',
          300: '#9fc49a',
          500: '#6ea864',
          600: '#548a49',
          700: '#406c37',
          800: '#2b4924',
          900: '#1c100a',
        },
        bark: {
          300: '#d4ba98',
          400: '#c49868',
          500: '#a87c4a',
          700: '#7c5a2e',
          900: '#452e14',
        },
        stone2: {
          400: '#9a9285',
          600: '#6b6358',
          900: '#1e1208',
        },
        // shadcn semantic tokens (CSS variable–driven)
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
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [animate],
};

export default config;
