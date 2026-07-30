import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function IconChip({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center border-2 border-zinc-900 bg-amber-200 text-zinc-900',
        className,
      )}
      style={{ borderRadius: '50% 45% 55% 50% / 50% 55% 45% 50%' }}
    >
      <Icon className="h-4 w-4" />
    </div>
  )
}
