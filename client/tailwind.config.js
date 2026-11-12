/** @type {import('tailwindcss').Config} */

// Theme colors are CSS variables (RGB channels, set in src/index.css) so the same classes
// work in dark and light mode. "white" means "foreground" and "ink" means "background":
// in light mode they swap, so text-white, border-white/10, bg-ink-800 etc. all follow the theme.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{html,js}'],
  // Theme is chosen with a class on <html>; the old `dark:` variants stay inert.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: v('fg'),
        ink: {
          DEFAULT: v('ink'), // page background
          900: v('ink-900'),
          800: v('ink-800'), // cards / surfaces
          700: v('ink-700'), // inputs, raised surfaces
          600: v('ink-600'), // hover
        },
        neutral: {
          100: v('n-100'),
          200: v('n-200'),
          300: v('n-300'),
          400: v('n-400'),
          500: v('n-500'),
          600: v('n-600'),
          700: v('n-700'),
          800: v('n-800'),
          900: v('n-900'),
        },
        // Lime stays bright for fills (buttons, chips); text-lime is darkened in light mode via CSS.
        lime: {
          DEFAULT: '#d4f54c',
          300: '#e3fa7f',
          400: '#d4f54c',
          500: '#c2e33a',
          600: '#a9c82b',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.18em',
      },
      keyframes: {
        orbit: { to: { transform: 'rotate(360deg)' } },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
        beam: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.9' },
        },
      },
      animation: {
        orbit: 'orbit 40s linear infinite',
        'orbit-reverse': 'orbit 40s linear infinite reverse',
        'pulse-ring': 'pulseRing 2.4s ease-out infinite',
        beam: 'beam 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
