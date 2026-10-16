/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./*.html", "./js/**/*.js"], 
  theme: {
      extend: {
          fontFamily: {
              sans: ['Inter', 'sans-serif'],
              mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
              brand: { 50: '#fffbeb', 100: '#fef3c7', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
              loss: { 50: '#fef2f2', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 900: '#7f1d1d' }
          },
          animation: {
              'blob': 'blob 15s infinite',
              'fadeIn': 'fadeIn 0.3s ease-out forwards',
          },
          keyframes: {
              blob: {
                  '0%': { transform: 'translate(0px, 0px) scale(1)' },
                  '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                  '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                  '100%': { transform: 'translate(0px, 0px) scale(1)' },
              },
              fadeIn: {
                  '0%': { opacity: '0', transform: 'translateY(10px)' },
                  '100%': { opacity: '1', transform: 'translateY(0)' },
              }
          }
      }
  },
  plugins: [],
}

