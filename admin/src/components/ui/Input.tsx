import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { WOBBLE_CONTROL } from '@/lib/sketch'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'font-sketch w-full border-2 border-zinc-900 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:-translate-y-0.5 focus:shadow-[3px_3px_0px_0px_#18181b]',
        className,
      )}
      style={{ borderRadius: WOBBLE_CONTROL, ...style }}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
