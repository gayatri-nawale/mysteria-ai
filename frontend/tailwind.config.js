export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        mystery: {
          bg: '#0A0A0F',
          surface: '#12121A',
          border: '#1E1E2E',
          purple: '#8B5CF6',
          teal: '#14B8A6',
          gold: '#F59E0B',
          red: '#EF4444',
          text: '#F8FAFC',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: []
}
