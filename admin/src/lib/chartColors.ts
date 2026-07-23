// Reference palette from the dataviz skill — validated categorical order
// (fixed adjacent-pair CVD safety), status roles, and chart chrome. Pick the
// light/dark step by `prefers-color-scheme` since this app has no manual
// theme toggle yet (Tailwind's `dark:` classes follow the same signal).
export function chartColors(isDark: boolean) {
  return {
    surface: isDark ? '#1a1a19' : '#fcfcfb',
    textSecondary: isDark ? '#c3c2b7' : '#52514e',
    muted: '#898781',
    gridline: isDark ? '#2c2c2a' : '#e1e0d9',
    baseline: isDark ? '#383835' : '#c3c2b7',
    // Categorical slots 1 & 2 — validated adjacent pair (CVD ΔE 9.1 light / 8.4 dark)
    series1: isDark ? '#3987e5' : '#2a78d6', // blue
    series2: isDark ? '#d95926' : '#eb6834', // orange
    // Status palette — fixed, never themed, reserved for state (not identity)
    good: '#0ca30c',
    warning: '#fab219',
    critical: '#d03b3b',
  }
}

export const STATUS_COLOR: Record<string, string> = {
  open: '#fab219',
  resolved: '#0ca30c',
  closed: '#898781',
}
