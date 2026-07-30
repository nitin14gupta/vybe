// Shared "sketch/paper" theme tokens. Hand-drawn radii are fixed values
// (not randomized) so server/client markup and every instance of a given
// element stay visually consistent.
export const INK = '#18181b' // zinc-900, the "marker ink" border/shadow color

export const WOBBLE_HERO = '255px 15px 225px 15px / 15px 225px 15px 255px' // login card, empty states
export const WOBBLE_CARD = '20px 8px 18px 10px / 10px 18px 8px 20px' // cards, dialogs
export const WOBBLE_CONTROL = '14px 6px 12px 8px / 8px 12px 6px 14px' // buttons, inputs, chips

export function inkShadow(px: number) {
  return `${px}px ${px}px 0px 0px ${INK}`
}
