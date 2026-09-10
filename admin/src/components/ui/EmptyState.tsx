import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-divider py-12 text-ink-secondary">
      <Icon className="h-8 w-8" />
      <p className="font-sans text-sm">{label}</p>
    </div>
  )
}
