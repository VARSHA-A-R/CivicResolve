/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#1E3A5F',
          900: '#0F233A',
          950: '#091524',
        },
        civic: {
          teal: {
            DEFAULT: '#0D9488',
            hover: '#0F766E',
            light: '#CCFBF1',
            dark: '#115E59',
          },
          emerald: {
            DEFAULT: '#059669',
            hover: '#047857',
            light: '#D1FAE5',
          },
          accent: '#14B8A6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'civic-card': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        'civic-hover': '0 10px 25px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.1)',
        'civic-glow': '0 0 20px -3px rgba(13, 148, 136, 0.25)',
      }
    },
  },
  plugins: [],
}
