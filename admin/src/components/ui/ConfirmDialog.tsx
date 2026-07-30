'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from './Button'
import { WOBBLE_CARD } from '@/lib/sketch'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  variant?: 'primary' | 'destructive'
  requireReason?: boolean
  reasonLabel?: string
  onConfirm: (reason?: string) => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'primary',
  requireReason = false,
  reasonLabel = 'Reason',
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm(requireReason ? reason : undefined)
      setReason('')
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border-2 border-zinc-900 bg-white p-5 shadow-[6px_6px_0px_0px_#18181b]"
          style={{ borderRadius: WOBBLE_CARD }}
        >
          <div className="mb-3 flex items-start justify-between">
            <Dialog.Title className="font-sketch text-xl font-bold text-zinc-900">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {description && <Dialog.Description className="mb-3 text-sm text-zinc-500">{description}</Dialog.Description>}

          {requireReason && (
            <div className="mb-4">
              <label className="font-sketch mb-1.5 block text-base text-zinc-700">{reasonLabel}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="font-sketch w-full border-2 border-zinc-900 bg-white px-3 py-2 text-base outline-none focus:-translate-y-0.5 focus:shadow-[3px_3px_0px_0px_#18181b]"
                style={{ borderRadius: WOBBLE_CARD }}
                placeholder="e.g. Multiple community guideline violations"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'primary'}
              onClick={handleConfirm}
              loading={submitting}
              disabled={requireReason && reason.trim().length === 0}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
