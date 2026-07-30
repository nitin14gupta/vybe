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
        'font-sketch rounded-full border-2 border-zinc-900 px-3.5 py-1.5 text-sm font-bold transition-all',
        active
          ? '-translate-y-0.5 bg-amber-300 text-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
          : 'bg-white text-zinc-600 hover:bg-zinc-50',
      )}
    >
      {label}
    </button>
  )
}
