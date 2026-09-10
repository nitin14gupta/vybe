export const ACTION_LABELS: Record<string, string> = {
  lock_user: 'Locked user',
  unlock_user: 'Unlocked user',
  force_cancel_event: 'Force-cancelled event',
  update_support_status: 'Updated ticket status',
}

export function targetHref(targetType: string, targetId: string | null): string | null {
  if (!targetId) return null
  if (targetType === 'user') return `/users/${targetId}`
  if (targetType === 'event') return `/events/${targetId}`
  return null
}
