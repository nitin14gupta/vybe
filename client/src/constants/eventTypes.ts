import { PartyPopper, Building2, Gamepad2, UtensilsCrossed, Music, Flame, Shield, Star, Gem, Crown } from 'lucide-react-native'

// Single source of truth for event-type icons and host-badge-tier icons —
// keep in sync with the badge tier names computed server-side in
// server/routes/users.py (compute_host_badges).
export const EVENT_ICONS: Record<string, any> = {
  house_party: PartyPopper,
  rooftop: Building2,
  game_night: Gamepad2,
  dinner: UtensilsCrossed,
  music: Music,
  other: Flame,
}
export const EVENT_ICON_FALLBACK = Flame

export const HOST_BADGE_ICONS: Record<string, any> = {
  Rising: Shield,
  Established: Star,
  Elite: Gem,
  Legend: Crown,
}
