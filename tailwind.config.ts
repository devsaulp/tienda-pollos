import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de la marca: verde agro + amarillo maiz
        agro: {
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
        },
        maiz: {
          100: '#fef9c3',
          400: '#facc15',
          500: '#eab308',
        },
      },
    },
  },
  plugins: [],
}
export default config
