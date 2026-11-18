/**
 * Design tokens for the EventSync client.
 * Every colour, font and radius a component needs is declared here.
 * Components use token classes (bg-canvas, text-muted, border-line) and never
 * hardcode a hex value. See client/README.md for the full reference.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F6',
        surface: '#FFFFFF',
        wash: '#F0EBE4',
        ink: { DEFAULT: '#1C1917', soft: '#44403C' },
        // Text and hairlines on the dark ink panel.
        onInk: { DEFAULT: '#FAF9F6', soft: '#D6D3D1', muted: '#A8A29E' },
        muted: '#6B645D',
        line: { DEFAULT: '#E7E5E4', strong: '#D6D3D1' },
        brand: { DEFAULT: '#9A3412', hover: '#7C2D12', soft: '#FDF2EC', tint: '#E9BFA8' },
        accent: '#B45309',
        success: '#15803D',
        warning: '#B45309',
        danger: '#B91C1C'
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif']
      },
      borderRadius: {
        card: '16px',
        field: '10px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.04), 0 12px 32px -12px rgba(28, 25, 23, 0.10)',
        field: 'inset 0 1px 2px rgba(28, 25, 23, 0.04)',
        button: '0 1px 2px rgba(28, 25, 23, 0.18)'
      }
    }
  },
  plugins: []
};
