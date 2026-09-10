import { cn } from '@/lib/utils'

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 font-sans text-sm font-semibold transition-all',
        active
          ? 'border-transparent bg-brand-gradient text-ink-on-accent glow-shadow-brand'
          : 'border-divider bg-transparent text-ink-secondary hover:bg-surface',
      )}
    >
      {label}
    </button>
  )
}
