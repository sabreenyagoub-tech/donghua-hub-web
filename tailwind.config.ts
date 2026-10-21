import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07080c',
          900: '#0b0d12',
          850: '#10131a',
          800: '#161a23',
          700: '#1f2430',
          600: '#2a3040',
        },
        brand: {
          DEFAULT: '#e11d48', // قابل للتغيير من لوحة الإدارة (app_settings.primary_color)
          600: '#be123c',
          400: '#fb7185',
        },
        accent: {
          DEFAULT: '#f59e0b',
          400: '#fbbf24',
        },
      },
      fontFamily: {
        arabic: ['"Tajawal"', '"Cairo"', '"Noto Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(225,29,72,0.45)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { fadeUp: 'fadeUp .4s ease-out both' },
    },
  },
  plugins: [],
};
export default config;
