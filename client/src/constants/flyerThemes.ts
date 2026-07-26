// Color themes for the "flyer" share card — a host can pick whichever fits
// their event's vibe. `ink`-family colors are pre-blended per theme (rather
// than computed at runtime from a single hex + alpha) so each theme's text/
// divider/decoration contrast is tuned by hand, not just "cream but darker."
// `bgDeep` is the gradient's shadow stop (card background runs bg → bgDeep,
// top to bottom) and `swatchGlow` is a brighter highlight used only for the
// glossy sphere look on the theme-picker swatches, not on the card itself.
export interface FlyerTheme {
  key: string
  label: string
  bg: string
  bgDeep: string
  swatchGlow: string
  ink: string
  inkMuted: string
  inkFaint: string
  chip: string
}

export const FLYER_THEMES: FlyerTheme[] = [
  {
    key: 'cream',
    label: 'Cream',
    bg: '#F1E9D8',
    bgDeep: '#E4D5B8',
    swatchGlow: '#FBF6EC',
    ink: '#171310',
    inkMuted: 'rgba(20,16,8,0.55)',
    inkFaint: 'rgba(20,16,8,0.14)',
    chip: 'rgba(20,16,8,0.08)',
  },
  {
    key: 'blush',
    label: 'Blush',
    bg: '#F4D9DF',
    bgDeep: '#E9B8C3',
    swatchGlow: '#FCEFF1',
    ink: '#2B1418',
    inkMuted: 'rgba(43,20,24,0.55)',
    inkFaint: 'rgba(43,20,24,0.14)',
    chip: 'rgba(43,20,24,0.08)',
  },
  {
    key: 'sage',
    label: 'Sage',
    bg: '#DCE8D6',
    bgDeep: '#BFD8B4',
    swatchGlow: '#EEF5EA',
    ink: '#16231A',
    inkMuted: 'rgba(22,35,26,0.55)',
    inkFaint: 'rgba(22,35,26,0.14)',
    chip: 'rgba(22,35,26,0.08)',
  },
  {
    key: 'sky',
    label: 'Sky',
    bg: '#DCE6F2',
    bgDeep: '#B9CEE8',
    swatchGlow: '#EEF3FA',
    ink: '#131E2A',
    inkMuted: 'rgba(19,30,42,0.55)',
    inkFaint: 'rgba(19,30,42,0.14)',
    chip: 'rgba(19,30,42,0.08)',
  },
  {
    key: 'noir',
    label: 'Noir',
    bg: '#1E1E1E',
    bgDeep: '#000000',
    swatchGlow: '#4A4A4A',
    ink: '#F3ECDD',
    inkMuted: 'rgba(243,236,221,0.6)',
    inkFaint: 'rgba(243,236,221,0.16)',
    chip: 'rgba(243,236,221,0.1)',
  },
]

export const DEFAULT_FLYER_THEME_KEY = FLYER_THEMES[0].key
