// Chart palette matching the Gorave dark theme — the admin panel has no
// light/dark toggle, so this always returns the dark values.
export function chartColors() {
  return {
    surface: '#1A1A1A', // --color-surface
    textSecondary: '#A09890', // --color-ink-secondary
    muted: '#4A4540', // --color-ink-disabled
    gridline: '#2A2A2A', // --color-divider
    baseline: '#333333', // --color-gray-border
    series1: '#FF6B35', // brand orange — chart data series, not a UI fill
    series2: '#9FC4FF', // map-radar-blue
    good: '#00C48C',
    warning: '#FFB830',
    critical: '#E5484D',
  }
}

export const STATUS_COLOR: Record<string, string> = {
  open: '#FFB830',
  resolved: '#00C48C',
  closed: '#4A4540',
}
