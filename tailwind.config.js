/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitchBlack: '#0A0A0A',
        darkBg: '#0F0F0F',
        accentOrange: '#FF6B00', // Safety Orange
        machineGray: '#2D2D2D',
        steelSilver: '#E0E0E0',
        machineryGreen: '#00FF41',
        brakeRed: '#FF0000',
        cardBg: '#161618',
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
