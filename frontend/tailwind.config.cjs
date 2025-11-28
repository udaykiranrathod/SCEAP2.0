/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sceap-bg': '#050814',
        'sceap-panel': '#0B1220',
        'sceap-border': '#1f2937',
        'sceap-accent': '#22d3ee',
        'sceap-accent-soft': '#06b6d4',
      },
      boxShadow: {
        'soft-glow': '0 0 40px rgba(34, 211, 238, 0.25)',
      },
    },
  },
  plugins: [],
};
