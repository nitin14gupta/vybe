import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md border-2 border-dashed border-zinc-300 bg-zinc-100', className)}
      {...props}
    />
  )
}
