export const Colors = {
  // Surfaces — layered depth system
  background: '#111111',       // canvas, root background
  surface: '#1A1A1A',          // cards, sheets
  elevated: '#222222',         // modals, popovers, input fills

  // Brand
  brandOrange: '#FF6B35',
  brandCoral: '#FF3864',

  // Accents
  accentGold: '#FFB830',       // tickets, badges, premium
  accentGreen: '#00C48C',      // success, active/online status

  // Text
  inkPrimary: '#F5F0EB',       // headings, primary content
  inkSecondary: '#A09890',     // captions, metadata
  inkDisabled: '#4A4540',      // placeholder, disabled state

  // Structure
  divider: '#2A2A2A',          // borders, separators
} as const

export type Color = (typeof Colors)[keyof typeof Colors]
