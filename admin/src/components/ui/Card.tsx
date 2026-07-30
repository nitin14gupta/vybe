import { cn } from '@/lib/utils'
import { WOBBLE_CARD } from '@/lib/sketch'

export function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-2 border-zinc-900 bg-white shadow-[4px_4px_0px_0px_#18181b]', className)}
      style={{ borderRadius: WOBBLE_CARD, ...style }}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b-2 border-dashed border-zinc-200 px-5 py-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-sketch text-lg font-bold text-zinc-900', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />
}
