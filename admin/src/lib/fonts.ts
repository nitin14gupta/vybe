import localFont from 'next/font/local'

export const cabinetGrotesk = localFont({
  src: [
    { path: '../fonts/CabinetGrotesk-Medium.otf', weight: '500', style: 'normal' },
    { path: '../fonts/CabinetGrotesk-Bold.otf', weight: '700', style: 'normal' },
    { path: '../fonts/CabinetGrotesk-Extrabold.otf', weight: '800', style: 'normal' },
  ],
  variable: '--font-cabinet',
  display: 'swap',
})

export const satoshi = localFont({
  src: [
    { path: '../fonts/Satoshi-Regular.otf', weight: '400', style: 'normal' },
    { path: '../fonts/Satoshi-Medium.otf', weight: '500', style: 'normal' },
    { path: '../fonts/Satoshi-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
})
