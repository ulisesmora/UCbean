import type { Config } from 'tailwindcss';

/**
 * Oliva y vidrio.
 *
 * El verde ácido pedía atención en cada elemento y acababa gritando. El
 * oliva es el mismo gesto con la voz más baja: sigue siendo verde de
 * bosque, pero convive con blanco y con texto sin pelearse.
 *
 * La regla de contraste no cambia: #A9C23F sobre blanco da 1.8:1, así que
 * el oliva es SOLO relleno y siempre lleva texto casi negro encima, donde
 * llega a 10.6:1. Oliva como texto sobre blanco es olive-700 (#55681A,
 * 6:1), que es el único miembro seguro.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        birch: {
          50: '#FFFFFF',
          100: '#F7F7F4',
          200: '#EAEAE4',
          300: '#D8D8D0',
        },
        // El acento. Ordenado de claro a oscuro.
        olive: {
          50: '#F5F8E9',
          100: '#E7EFC6',
          300: '#C8DC72',
          500: '#A9C23F', // relleno, 10.6:1 contra tinta
          600: '#8CA32E',
          700: '#55681A', // el único seguro como texto sobre blanco
          900: '#2C3609',
        },
        bark: {
          100: '#FFEDE6',
          300: '#FFC9AE',
          500: '#E85D2A',
          700: '#9C3A0D',
        },
        stone2: {
          200: '#E6E6E1',
          300: '#C4C4BE',
          400: '#8A8A82',
          600: '#57574F',
          900: '#111110',
        },
      },
      // Apple redondea. El brutalismo se queda en el grosor del trazo y
      // en la tipografía, no en las esquinas.
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '26px',
        full: '9999px',
      },
      boxShadow: {
        // Sombras en capas, como las de iOS: una cerca para el borde y
        // otra lejos y muy suave para la elevación.
        glass: '0 1px 2px rgba(17,17,16,0.05), 0 8px 24px -8px rgba(17,17,16,0.12)',
        'glass-lg': '0 2px 4px rgba(17,17,16,0.05), 0 18px 40px -12px rgba(17,17,16,0.18)',
        'glass-inset': 'inset 0 1px 0 rgba(255,255,255,0.75)',
      },
      backdropBlur: { xs: '2px', glass: '18px' },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
      },
      animation: {
        rise: 'rise 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        sheen: 'sheen 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionTimingFunction: {
        // La curva de las transiciones de iOS: sale rápido y frena suave.
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
