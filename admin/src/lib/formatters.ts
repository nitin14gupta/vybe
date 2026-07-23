import { format, formatDistanceToNow } from 'date-fns'

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return format(d, 'd MMM yyyy, h:mm a')
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
}
