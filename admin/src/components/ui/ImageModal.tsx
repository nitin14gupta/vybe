'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ImageModalProps {
  photos: { url: string; position: number }[]
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageModal({ photos, initialIndex = 0, open, onOpenChange }: ImageModalProps) {
  if (photos.length === 0) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/90" />
        <Dialog.Content className="fixed inset-0 z-[60] flex items-center justify-center p-4 outline-none">
          <Dialog.Title className="sr-only">Photo</Dialog.Title>
          <Dialog.Close className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </Dialog.Close>
          {/* Keyed by initialIndex so re-opening on a different photo starts
              there, without needing an effect to sync internal state. */}
          {open && <ImageModalBody key={initialIndex} photos={photos} initialIndex={initialIndex} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ImageModalBody({ photos, initialIndex }: { photos: ImageModalProps['photos']; initialIndex: number }) {
  const sorted = [...photos].sort((a, b) => a.position - b.position)
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + sorted.length) % sorted.length)
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % sorted.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sorted.length])

  return (
    <>
      {sorted.length > 1 && (
        <button
          onClick={() => setIndex((i) => (i - 1 + sorted.length) % sorted.length)}
          className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sorted[index].url}
        alt=""
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
      />

      {sorted.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i + 1) % sorted.length)}
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {index + 1} / {sorted.length}
          </div>
        </>
      )}
    </>
  )
}
