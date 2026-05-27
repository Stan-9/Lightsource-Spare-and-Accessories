/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitchBlack: '#1C1917',
        darkBg: '#231F1B',
        accentOrange: '#C87A3E',
        machineGray: '#322D27',
        steelSilver: '#F5EBE0',
        machineryGreen: '#81B29A',
        brakeRed: '#C95A49',
        cardBg: '#2E2924',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        technical: ['Orbitron', 'sans-serif'],
        utilitarian: ['IBM Plex Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'mechanical-slide': 'mechanical-slide 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
      },
      keyframes: {
        'mechanical-slide': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
