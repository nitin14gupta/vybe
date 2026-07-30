import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WOBBLE_HERO, WOBBLE_CONTROL } from '@/lib/sketch'

export const WOBBLE_LG = WOBBLE_HERO
export const WOBBLE_SM = WOBBLE_CONTROL

export function SketchCard({
  children,
  className,
  rotate = false,
}: {
  children: ReactNode
  className?: string
  rotate?: boolean
}) {
  return (
    <div
      className={cn(
        'relative border-2 border-zinc-900 bg-white shadow-[6px_6px_0px_0px_rgba(24,24,27,0.9)]',
        rotate && '-rotate-1',
        className,
      )}
      style={{ borderRadius: WOBBLE_HERO }}
    >
      {children}
    </div>
  )
}

export function SketchTape({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute -top-4 left-1/2 h-8 w-20 -translate-x-1/2 -rotate-2 border border-white/40 bg-amber-200/70 shadow-sm backdrop-blur-[1px]',
        className,
      )}
    />
  )
}

interface SketchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const SketchInput = forwardRef<HTMLInputElement, SketchInputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full border-2 border-zinc-900 bg-white px-4 py-2.5 font-sketch text-base text-zinc-900 outline-none transition-all placeholder:text-zinc-400',
        'focus:-translate-y-0.5 focus:shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]',
        error && 'border-red-500',
        className,
      )}
      style={{ borderRadius: WOBBLE_SM }}
      {...props}
    />
  ),
)
SketchInput.displayName = 'SketchInput'

interface SketchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export const SketchButton = forwardRef<HTMLButtonElement, SketchButtonProps>(
  ({ children, className, loading, disabled, variant = 'primary', ...props }, ref) => {
    const styles = {
      primary:
        'bg-amber-300 text-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]',
      ghost: 'border-dashed bg-transparent hover:bg-zinc-100',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 border-2 border-zinc-900 px-4 py-2.5 font-sketch text-lg font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60',
          styles[variant],
          className,
        )}
        style={{ borderRadius: WOBBLE_SM }}
        {...props}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
      </button>
    )
  },
)
SketchButton.displayName = 'SketchButton'
