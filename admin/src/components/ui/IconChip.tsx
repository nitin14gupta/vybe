import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function IconChip({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-divider bg-surface-muted text-ink-primary',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  )
}
