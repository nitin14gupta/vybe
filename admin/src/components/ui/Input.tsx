import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-[52px] w-full rounded-input border-[1.5px] border-divider bg-elevated px-4 font-sans text-sm text-ink-primary outline-none transition-all placeholder:text-ink-secondary',
        'focus:border-ink-secondary focus:shadow-[0_0_0_3px_rgba(245,240,235,0.08)]',
        'aria-invalid:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
