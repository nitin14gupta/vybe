import type { EventSummary } from '@/api/apiService'
import { parseServerDate } from '@/lib/dates'

export const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'free', label: 'Free' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'music', label: 'Music' },
  { key: 'dinner', label: 'Food' },
  { key: 'house_party', label: 'Party' },
  { key: 'game_night', label: 'Games' },
] as const

export type FilterChipKey = (typeof FILTER_CHIPS)[number]['key']

export function matchesChip(event: EventSummary, chipKey: string, now: Date = new Date()): boolean {
  if (chipKey === 'all') return true
  if (chipKey === 'free') return event.is_free

  const d = parseServerDate(event.date_time)
  if (chipKey === 'tonight') {
    if (!d) return false
    return d.toDateString() === now.toDateString()
  }
  if (chipKey === 'weekend') {
    if (!d) return false
    const day = d.getDay() // 0 = Sun, 5 = Fri, 6 = Sat
    return day === 0 || day === 5 || day === 6
  }

  // music, dinner, house_party, game_night
  return event.event_type === chipKey
}
