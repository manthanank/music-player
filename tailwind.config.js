/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3B82F6', // blue-500
          dark: '#60A5FA'   // blue-400
        }
      }
    },
  },
  plugins: [],
};
