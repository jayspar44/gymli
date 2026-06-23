/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Required for NativeWind to toggle color scheme manually on web (setColorScheme)
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ported from the current zinc/amber theme
        primary: '#d4872a',
        bg: { DEFAULT: '#fafafa', dark: '#09090b' },
        surface: { DEFAULT: '#ffffff', alt: '#f4f4f5', dark: '#18181b' },
      },
    },
  },
  plugins: [],
};
