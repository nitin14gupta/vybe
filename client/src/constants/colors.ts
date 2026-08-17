export const Colors = {
  // Surfaces — layered depth system
  background: '#111111',       // canvas, root background
  surface: '#1A1A1A',          // cards, sheets
  elevated: '#222222',         // modals, popovers, input fills
  surfaceMuted: '#2A2A2A',     // skeleton loading blocks, avatar/image fallback bg

  // Brand
  brandOrange: '#FF6B35',
  brandCoral: '#FF3864',

  // Accents
  accentGold: '#FFB830',       // tickets, badges, premium
  accentGreen: '#00C48C',      // success, active/online status
  onlineGreen: '#4CAF50',      // presence dot (distinct shade from accentGreen, used for the literal online indicator)
  destructive: '#E5484D',      // destructive actions, error states — the single canonical "danger" red

  // Text
  inkPrimary: '#F5F0EB',       // headings, primary content
  inkSecondary: '#A09890',     // captions, metadata
  inkDisabled: '#4A4540',      // placeholder, disabled state
  inkOnAccent: '#111111',      // text/icons on light or brand-colored fills (active tabs, toggles, buttons)
  // Structure
  divider: '#2A2A2A',          // borders, separators

  white: '#FFFFFF',
  nearBlack: '#0A0A0A',

  // Skeleton loading shimmer (two-stop gradient)
  skeletonBase: '#1E1E1E',
  skeletonHighlight: '#2E2E2E',
  skeletonAlt: '#4A4A4A',          // lighter skeleton pair used on a couple of screens
  skeletonAltHighlight: '#6A6A6A',

  sheetBackground: '#141414',      // bottom-sheet root background
  deepBackground: '#0D0D0D',       // darkest card/gradient/map-water fill
  grayBorder: '#333333',           // input borders, disabled pill fill

  // Misc accents
  notificationRed: '#FF3040',      // unread/notification dot
  offerGreen: '#00C896',           // waitlist offer highlight (distinct shade from accentGreen)
  mapRadarBlue: '#9FC4FF',         // map location-radius glow

  // Glassmorphism (Overlays)
  glassSurface: 'rgba(255,255,255,0.1)',
  glassSurfaceActive: 'rgba(255,255,255,0.25)',
  glassBorder: 'rgba(255,255,255,0.2)',
  glassBorderThick: 'rgba(255,255,255,0.3)',
  glassTextSecondary: 'rgba(255,255,255,0.7)',
  glassTextDisabled: 'rgba(255,255,255,0.5)',
  glassOverlay: 'rgba(0,0,0,0.6)',
} as const

export type Color = (typeof Colors)[keyof typeof Colors]
export function withOpacity(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
