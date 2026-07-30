'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { WOBBLE_CONTROL } from '@/lib/sketch'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-zinc-900 font-sketch font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:translate-y-0',
  {
    variants: {
      variant: {
        primary:
          'bg-amber-300 text-zinc-900 shadow-[3px_3px_0px_0px_#18181b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#18181b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#18181b]',
        secondary:
          'bg-white text-zinc-900 shadow-[3px_3px_0px_0px_#18181b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#18181b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#18181b]',
        ghost: 'border-transparent shadow-none hover:bg-zinc-100 active:translate-y-0',
        destructive:
          'bg-red-200 text-red-900 shadow-[3px_3px_0px_0px_#18181b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#18181b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#18181b]',
        outline: 'border-dashed bg-white text-zinc-700 shadow-none hover:bg-zinc-50',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, style, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      style={{ borderRadius: WOBBLE_CONTROL, ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
