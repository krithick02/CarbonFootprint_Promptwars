/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B4332',
          50: '#E8F5EE',
          100: '#C6E6D4',
          200: '#9FD4B5',
          300: '#78C196',
          400: '#52B788',
          500: '#2D9B68',
          600: '#1B4332',
          700: '#163829',
          800: '#112C20',
          900: '#0C1F16',
        },
        mint: {
          DEFAULT: '#52B788',
          light: '#74C69D',
          dark: '#40916C',
        },
        amber: {
          carbon: '#F4A261',
          dark: '#E76F51',
        },
        offwhite: '#F8F9FA',
        carbon: {
          low: '#52B788',
          mid: '#F4A261',
          high: '#E63946',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-forest': 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(27,67,50,0.9) 0%, rgba(45,106,79,0.9) 100%)',
        'gradient-hero': 'radial-gradient(ellipse at 20% 50%, #1B4332 0%, #0C1F16 60%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite',
        'particle': 'particle 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(82, 183, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(82, 183, 136, 0.6)' },
        },
        particle: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '0.5' },
          '100%': { transform: 'translateY(-200px) translateX(50px)', opacity: '0' },
        },
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow-mint': '0 0 30px rgba(82, 183, 136, 0.4)',
        'glow-amber': '0 0 30px rgba(244, 162, 97, 0.4)',
      },
    },
  },
  plugins: [],
}
