'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from './Button'

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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-glass-overlay backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-modal border border-divider bg-surface p-5 glow-shadow">
          <div className="mb-3 flex items-start justify-between">
            <Dialog.Title className="font-display text-xl font-bold text-ink-primary">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full p-1 text-ink-secondary hover:bg-surface-muted">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {description && <Dialog.Description className="mb-3 text-sm text-ink-secondary">{description}</Dialog.Description>}

          {requireReason && (
            <div className="mb-4">
              <label className="mb-1.5 block font-sans text-sm text-ink-secondary">{reasonLabel}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-input border-[1.5px] border-divider bg-elevated px-3 py-2 font-sans text-sm text-ink-primary outline-none focus:border-ink-secondary"
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
