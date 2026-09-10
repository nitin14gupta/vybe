import type { LucideIcon } from 'lucide-react'
import { Card } from './Card'

export function DetailStatsRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

export function DetailStat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-surface-muted text-brand-orange">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-ink-secondary">{label}</p>
        <p className="font-semibold text-ink-primary">{value}</p>
      </div>
    </Card>
  )
}
