/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8FA',
        surface: '#FFFFFF',
        surface2: '#FBFCFD',
        ink: '#111827',
        muted: '#6B7280',
        faint: '#9CA3AF',
        line: '#ECEEF1',
        line2: '#E3E6EA',
        accent: {
          DEFAULT: '#0E7A5F',
          strong: '#0B6450',
          soft: '#E7F3EF',
          line: '#CDE7DF',
        },
        warn: { DEFAULT: '#B4692B', soft: '#FBF2E9' },
        info: { DEFAULT: '#2F5FE0', soft: '#EEF2FD' },
        cat: { gym: '#0E7A5F', run: '#2563EB', bike: '#B4692B', swim: '#0E8FA8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { xl2: '18px' },
      boxShadow: {
        card: '0 1px 2px rgba(17,24,39,.04)',
        soft: '0 1px 2px rgba(17,24,39,.03), 0 10px 26px rgba(17,24,39,.05)',
        lg2: '0 20px 50px rgba(17,24,39,.10)',
        hero: '0 14px 34px rgba(11,90,71,.28)',
      },
    },
  },
  plugins: [],
};
