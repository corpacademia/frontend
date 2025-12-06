
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary Colors (Blue Spectrum)
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc4fc',
          400: '#36a9f7',
          500: '#0c8ee7', // Main brand color
          600: '#006fc4',
          700: '#0059a3',
          800: '#004a86',
          900: '#003f6f',
        },
        // Secondary Colors (Purple Spectrum)
        secondary: {
          50: '#f5f3ff',
          100: '#ede8ff',
          200: '#ddd6fe',
          300: '#c3b5ff',
          400: '#a289ff',
          500: '#8257fe', // Main accent
          600: '#7434fb',
          700: '#5e22c6',
          800: '#4d1d99',
          900: '#461d99',
        },
        // Accent Colors (Teal/Green Spectrum)
        accent: {
          50: '#edfcf7',
          100: '#d3f8ea',
          200: '#aaf0d8',
          300: '#73e3bd',
          400: '#39cba7',
          500: '#15b38d', // Main accent
          600: '#0d9270',
          700: '#09725d',
          800: '#0a5d49',
          900: '#0a4a3e',
        },
        dark: {
          100: '#1E2137',
          200: '#171B2D',
          300: '#111524',
          400: '#0C0F1A',
          500: '#080A12',
          600: '#05060C',
          700: '#030408',
          800: '#020304',
          900: '#010102',
        },
        light: {
          50: '#ffffff',
          100: '#fafbfc',
          200: '#f4f6f8',
          300: '#e9ecef',
          400: '#dee2e6',
          500: '#ced4da',
          600: '#adb5bd',
          700: '#868e96',
          800: '#495057',
          900: '#212529',
        },
        glow: {
          blue: '#0c8ee7',
          purple: '#8257fe',
          teal: '#15b38d',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'neural-pattern': "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230c8ee7' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 45deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-pattern': "url('data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%230c8ee7' fill-opacity='0.03'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'marquee': 'marquee 30s linear infinite',
        'bounce-x': 'bounce-x 1s infinite',
        'fade': 'fade 1s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 0.3s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.5',
            transform: 'scale(1.05)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'bounce-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 10px -2px var(--tw-shadow-color)',
        'glow': '0 0 20px -3px var(--tw-shadow-color)',
        'glow-lg': '0 0 30px -5px var(--tw-shadow-color)',
        'glow-xl': '0 0 40px -8px var(--tw-shadow-color)',
        'inner-glow': 'inset 0 0 20px -5px var(--tw-shadow-color)',
      },
    },
  },
  plugins: [],
};
