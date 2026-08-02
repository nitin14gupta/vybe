import { PartyPopper, Building2, Gamepad2, UtensilsCrossed, Music, Flame } from 'lucide-react-native'

export const EVENT_ICONS: Record<string, any> = {
  house_party: PartyPopper,
  rooftop: Building2,
  game_night: Gamepad2,
  dinner: UtensilsCrossed,
  music: Music,
  other: Flame,
}
export const EVENT_ICON_FALLBACK = Flame

export const HOST_BADGE_IMAGES: Record<string, any> = {
  Rising: require('../../assets/host_badges/rising.png'),
  Elite: require('../../assets/host_badges/elite.png'),
  Established: require('../../assets/host_badges/established.png'),
  Legend: require('../../assets/host_badges/legend.png'),
}
