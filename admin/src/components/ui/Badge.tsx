import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-sans text-xs font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        neutral: 'border-divider bg-surface-muted text-ink-secondary',
        success: 'border-transparent bg-offer-green/15 text-offer-green',
        warning: 'border-transparent bg-accent-gold/15 text-accent-gold',
        danger: 'border-transparent bg-destructive/15 text-destructive',
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
