'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageSliderProps {
  photos: { url: string; position: number }[]
  aspect?: '1:1' | '16:9'
  className?: string
  /** Called when the image itself (not the prev/next/dot controls) is clicked. */
  onImageClick?: () => void
}

export function ImageSlider({ photos, aspect = '16:9', className, onImageClick }: ImageSliderProps) {
  const [index, setIndex] = useState(0)
  const sorted = [...photos].sort((a, b) => a.position - b.position)

  if (sorted.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800',
          aspect === '1:1' ? 'aspect-square' : 'aspect-video',
          className,
        )}
      >
        <ImageOff className="h-8 w-8" />
      </div>
    )
  }

  const go = (delta: number) => {
    setIndex((i) => (i + delta + sorted.length) % sorted.length)
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800', aspect === '1:1' ? 'aspect-square' : 'aspect-video', className)}>
      <div
        className={cn('flex h-full transition-transform duration-300 ease-out', onImageClick && 'cursor-pointer')}
        style={{ transform: `translateX(-${index * 100}%)` }}
        onClick={onImageClick}
      >
        {sorted.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.position} src={p.url} alt="" className="h-full w-full shrink-0 object-cover" />
        ))}
      </div>

      {sorted.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {sorted.map((p, i) => (
              <button
                key={p.position}
                onClick={() => setIndex(i)}
                className={cn('h-1.5 w-1.5 rounded-full', i === index ? 'bg-white' : 'bg-white/50')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
