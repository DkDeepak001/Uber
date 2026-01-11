/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'uber-black': '#000000',
        'uber-gray': '#F6F6F6',
        'uber-dark-gray': '#222222',
        'uber-light-gray': '#EEEEEE',
      },
    },
  },
  plugins: [],
}
