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
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-zinc-900 bg-amber-200 text-zinc-900"
        style={{ borderRadius: '50% 45% 55% 50% / 50% 55% 45% 50%' }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-sketch text-sm text-zinc-500">{label}</p>
        <p className="font-sketch text-2xl font-bold text-zinc-900">{value}</p>
      </div>
    </Card>
  )
}
