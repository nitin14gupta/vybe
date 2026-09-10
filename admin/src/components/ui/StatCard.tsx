import { Card } from './Card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  className?: string
}

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex items-center gap-4 p-5', className)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input bg-surface-muted text-brand-orange">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-sans text-sm text-ink-secondary">{label}</p>
        <p className="font-display text-2xl font-bold text-ink-primary">{value}</p>
      </div>
    </Card>
  )
}
