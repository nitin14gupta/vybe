import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border-2 border-zinc-900 px-2.5 py-0.5 font-sketch text-xs font-bold',
  {
    variants: {
      variant: {
        neutral: 'bg-zinc-100 text-zinc-700',
        success: 'bg-emerald-200 text-emerald-900',
        warning: 'bg-amber-200 text-amber-900',
        danger: 'bg-red-200 text-red-900',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
}
