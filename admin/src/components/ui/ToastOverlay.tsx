'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'

const BADGE_STYLES = {
  default: 'bg-surface-muted',
  success: 'bg-offer-green/20',
  error: 'bg-destructive/20',
}

export function ToastOverlay() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end justify-end gap-2 p-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            className="pointer-events-auto flex w-fit max-w-sm items-center gap-3 rounded-full bg-[rgba(38,38,38,0.92)] py-2 pl-2 pr-4 glow-shadow backdrop-blur-md"
          >
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full', BADGE_STYLES[toast.type])}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="" className="h-4 w-4" />
            </span>
            <span className="flex-1 font-sans text-sm font-medium text-ink-primary">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-full p-0.5 text-ink-secondary opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
