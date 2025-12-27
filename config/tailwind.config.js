export default {
  content: [
    "./index.html",
    "./pages/**/*.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#050505',
        'bg-darker': '#0a0a0f',
        'accent-primary': '#6366f1',
        'accent-secondary': '#a855f7',
        'accent-success': '#10b981',
        'accent-warning': '#f59e0b',
        'accent-error': '#ef4444',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
