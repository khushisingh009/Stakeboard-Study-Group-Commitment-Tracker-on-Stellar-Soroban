/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate_bg: '#1B2430',
        board: '#22303E',
        chalk: '#F4F1E8',
        rule: '#374559',
        accent: {
          DEFAULT: '#E8B84B',
          soft: '#3A331C',
        },
        good: '#5FBF8F',
        bad: '#E0715C',
      },
      fontFamily: {
        display: ['"Lexend"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '0.625rem',
      },
    },
  },
  plugins: [],
};
