import { parseServerDate } from '@/lib/dates'

export type RsvpStatus = 'idle' | 'going' | 'waitlist' | 'loading'

export const parseDate = parseServerDate

export const hoursUntil = (iso: string) => {
  const d = parseDate(iso)
  return d ? (d.getTime() - Date.now()) / 3_600_000 : Infinity
}

export function calcAge(dob: string): number {
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export function formatDateTime(iso: string | null | undefined) {
  const d = parseDate(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function daysUntil(iso: string) {
  const eventDate = parseDate(iso)
  if (!eventDate) return ''
  const now = new Date()
  // Strip time — compare calendar dates only
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
  const diffDays = Math.round((eventMidnight.getTime() - todayMidnight.getTime()) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return `${diffDays} days away`
}

export function formatPrice(price: number, isFree: boolean) {
  if (isFree) return 'Free'
  return `₹${price}`
}

export function fmtCountdown(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
