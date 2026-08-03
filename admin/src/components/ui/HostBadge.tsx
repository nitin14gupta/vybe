import { cn } from '@/lib/utils'
import type { HostBadgeTier } from '@/types/user'

interface HostBadgeProps {
  tier: HostBadgeTier | null | undefined
  size?: number
  className?: string
}

export function HostBadge({ tier, size = 20, className }: HostBadgeProps) {
  if (!tier) return null

  return (
    <img
      src={`/host_badges/${tier.toLowerCase()}.png`}
      alt={`${tier} host`}
      title={`${tier} host`}
      width={size}
      height={size}
      className={cn('shrink-0', className)}
    />
  )
}
