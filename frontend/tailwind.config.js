/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#060814',
          card: '#0f1429',
          border: '#1e293b',
          purple: '#8b5cf6',
          blue: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
};
