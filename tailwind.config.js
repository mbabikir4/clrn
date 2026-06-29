/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette for the marketplace shell.
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          500: '#2f6bff',
          600: '#1f51e6',
          700: '#1840b4',
          900: '#0f2461',
        },
      },
    },
  },
  plugins: [],
};
