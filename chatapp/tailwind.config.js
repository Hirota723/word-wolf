/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}', './src/**/*.vue', './src/**/*.html'],
  theme: {
    extend: {
      colors: {
        red: {
          500: "#E06C75",
        },
        green: {
          300: "#98C379",
        },
        yellow: {
          500: "#D19A66",
        },
        purple: {
          500: "#C678DD",
        },
        gray: {
          DEFAULT: "#282C34",
        }
      }
    },
  },
  plugins: [],
  safelist: [
    'text-yellow',
    'text-red',
    'text-green',
    'text-cyan-500'
  ],
}
