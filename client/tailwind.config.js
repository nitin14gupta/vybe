/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#111111',
        surface: '#1A1A1A',
        elevated: '#222222',
        'brand-orange': '#FF6B35',
        'brand-coral': '#FF3864',
        'accent-gold': '#FFB830',
        'accent-green': '#00C48C',
        'ink-primary': '#F5F0EB',
        'ink-secondary': '#A09890',
        'ink-disabled': '#4A4540',
        divider: '#2A2A2A',
      },
      fontFamily: {
        'cabinet-extrabold': ['CabinetGrotesk-Extrabold'],
        'cabinet-bold': ['CabinetGrotesk-Bold'],
        'cabinet-medium': ['CabinetGrotesk-Medium'],
        satoshi: ['Satoshi-Regular'],
        'satoshi-medium': ['Satoshi-Medium'],
        'satoshi-bold': ['Satoshi-Bold'],
      },
      fontSize: {
        'display-xl': ['72px', { lineHeight: '72px', letterSpacing: '-0.03em' }],
        'heading-lg': ['32px', { lineHeight: '38px', letterSpacing: '-0.02em' }],
        'heading-md': ['28px', { lineHeight: '34px', letterSpacing: '-0.01em' }],
        'heading-sm': ['24px', { lineHeight: '30px', letterSpacing: '-0.01em' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        'body-md': ['14px', { lineHeight: '20px' }],
        'body-sm': ['13px', { lineHeight: '18px' }],
        label: ['11px', { lineHeight: '14px', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        input: '12px',
        'input-lg': '14px',
        card: '16px',
        modal: '28px',
      },
      spacing: {
        'screen-pad': '24px',
        'section-gap': '18px',
        gutter: '12px',
      },
    },
  },
  plugins: [],
}
