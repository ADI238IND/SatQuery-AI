/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#0A0E13',
        surface: '#10151C',
        elevated: '#171D26',
        border: {
          DEFAULT: '#232B37',
          strong: '#2E3846',
        },
        text: {
          primary: '#E7EBF1',
          secondary: '#8B95A6',
          muted: '#5B6472',
        },
        signal: '#2DD4C9',
        thermal: '#F5A623',
        alert: '#FB7185',
        water: '#4C8DFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '8px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
