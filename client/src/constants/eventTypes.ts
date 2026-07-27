// Single source of truth for event-type emojis and host-badge-tier emojis —
// keep in sync with the badge tier names computed server-side in
// server/routes/users.py (compute_host_badges).
export const EVENT_EMOJIS: Record<string, string> = {
  house_party: '🎉',
  rooftop: '🌆',
  game_night: '🎮',
  dinner: '🍽️',
  music: '🎵',
  other: '🔥',
}

export const HOST_BADGES: Record<string, string> = {
  Rising: '🛡️',
  Established: '⭐',
  Elite: '💎',
  Legend: '👑',
}
