/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f7',
          100: '#ccf0e8',
          200: '#99e1d1',
          300: '#66d2ba',
          400: '#33c3a3',
          500: '#00b48c', // Primary
          600: '#009070',
          700: '#006c54',
          800: '#004838',
          900: '#00241c',
        },
        secondary: {
          50: '#faf7f4',
          100: '#f5efe8',
          200: '#ebdfd1',
          300: '#e1cfba',
          400: '#d7bfa3',
          500: '#cdaf8c', // Secondary
          600: '#a48c70',
          700: '#7b6954',
          800: '#524638',
          900: '#29231c',
        },
        accent: {
          50: '#fff8f0',
          100: '#ffe8cc',
          200: '#ffd199',
          300: '#ffba66',
          400: '#ffa333',
          500: '#ff8c00', // Accent
          600: '#cc7000',
          700: '#995400',
          800: '#663800',
          900: '#331c00',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        }
      },
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

