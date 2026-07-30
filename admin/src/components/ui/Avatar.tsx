import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
}

export function Avatar({ src, name, size = 36, className }: AvatarProps) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase()

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-amber-200 text-zinc-900',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? 'avatar'} className="h-full w-full object-cover" />
      ) : initial ? (
        <span className="font-sketch text-sm font-bold">{initial}</span>
      ) : (
        <User className="h-4 w-4" />
      )}
    </div>
  )
}
