/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // class-based dark mode — toggled by adding 'dark' to <html>
  theme: {
    extend: {
      colors: {
        wa: {
          green:  '#25D366',
          dark:   '#075E54',
          light:  '#DCF8C6',
          teal:   '#128C7E',
          // Dark-mode palette (WhatsApp Web dark)
          dbg:    '#0b141a', // page background
          dpanel: '#111b21', // panel / card background
          dsurf:  '#1f2c33', // surface / input background
          dbdr:   '#2a3942', // border
          dmuted: '#8696a0', // muted text
          dtext:  '#e9edef', // primary text
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
