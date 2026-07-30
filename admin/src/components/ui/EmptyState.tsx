import type { LucideIcon } from 'lucide-react'
import { WOBBLE_CARD } from '@/lib/sketch'

export function EmptyState({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div
      className="flex flex-col items-center gap-2 border-2 border-dashed border-zinc-300 py-12 text-zinc-400"
      style={{ borderRadius: WOBBLE_CARD }}
    >
      <Icon className="h-8 w-8" />
      <p className="font-sketch text-base">{label}</p>
    </div>
  )
}
