/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './layouts/**/*.html',
    './content/**/*.md',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink:    { DEFAULT: '#1a1a1a', light: '#555', faint: '#999' },
        rule:   '#e2e2de',
        bg:     { DEFAULT: '#fafaf8', card: '#ffffff' },
        accent: { DEFAULT: '#2a5c45', mid: '#4a8c6a', light: '#eaf2ee', dark: '#1e4533' },
      },
      maxWidth: { wide: '1400px' },
      fontSize: { '2xs': ['0.68rem', { lineHeight: '1rem' }] },
    }
  },
  safelist: ['min-w-[160px]', 'min-w-[180px]'],
  plugins: [],
}
