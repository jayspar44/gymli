/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forge: {
          50: '#fdf8f0',
          100: '#f9ecd8',
          200: '#f2d5a8',
          300: '#e8b96e',
          400: '#dea043',
          500: '#d4872a',
          600: '#b86b1f',
          700: '#96501d',
          800: '#7a411f',
          900: '#66371e',
          950: '#391b0e',
        },
        stone: {
          850: '#1c1917',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
