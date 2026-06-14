import { Colors } from './colors'

// Brand gradient: ONLY on primary CTA button, splash logo, centre nav tab icon.
// Never use this anywhere else — it's the brand's primary visual identity signal.
export const BrandGradient = {
  colors: [Colors.brandOrange, Colors.brandCoral] as [string, string],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
  angle: 135,
} as const

// Overlay for event/profile photo cards — dark fade at bottom to keep white text legible
export const PhotoOverlayGradient = {
  colors: ['transparent', 'rgba(17,17,17,0.85)'] as [string, string],
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
} as const
