import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { WOBBLE_CONTROL } from '@/lib/sketch'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, style, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'font-sketch h-9 shrink-0 border-2 border-zinc-900 bg-white px-2 text-sm text-zinc-900 outline-none transition-all focus:-translate-y-0.5 focus:shadow-[3px_3px_0px_0px_#18181b]',
        className,
      )}
      style={{ borderRadius: WOBBLE_CONTROL, ...style }}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
