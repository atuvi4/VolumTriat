/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F7F6',
        surface: '#FFFFFF',
        surface2: '#FBFCFD',
        ink: '#111827',
        muted: '#6B7280',
        faint: '#8A919C',
        line: '#ECEEF1',
        line2: '#E3E6EA',
        track: '#EEF1F3', // fons de barres de progrés
        seg: '#EDEFF2', // fons de controls segmentats
        accent: {
          DEFAULT: '#0E7A5F',
          strong: '#0B6450',
          bright: '#12AA80',
          soft: '#E7F3EF',
          line: '#CDE7DF',
        },
        warn: { DEFAULT: '#B4692B', soft: '#FBF2E9', line: '#EAD8C2' },
        info: { DEFAULT: '#2F5FE0', soft: '#EEF2FD', line: '#D3E0FC' },
        danger: { DEFAULT: '#B3403A', soft: '#FBEFEE', line: '#F0D4D2' },
        cat: { gym: '#0E7A5F', run: '#2563EB', bike: '#B4692B', swim: '#0E8FA8' },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Instrument Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '20px' },
      boxShadow: {
        card: '0 1px 2px rgba(16,44,34,.04), 0 6px 20px rgba(16,44,34,.04)',
        soft: '0 1px 2px rgba(16,44,34,.03), 0 10px 26px rgba(16,44,34,.05)',
        lg2: '0 20px 50px rgba(16,44,34,.12)',
        hero: '0 14px 34px rgba(11,90,71,.28)',
        nav: '0 6px 24px rgba(16,44,34,.10), 0 1px 2px rgba(16,44,34,.05)',
      },
    },
  },
  plugins: [],
};
