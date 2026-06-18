// ToastBanner is kept for backward compatibility but now routes through the global pill.
// Call sites that import ToastBanner can keep working — the pill shows at 75% screen height.
export { usePillStore as useToast } from '@/store/pillStore'

import { usePillStore } from '@/store/pillStore'

export type ToastType = 'error' | 'success' | 'info'

// Legacy component shim — kept so existing imports don't break.
// Previously rendered its own animated banner; now triggers the global PillOverlay instead.
import { useEffect } from 'react'

interface Props {
  message: string
  type?: ToastType
}

export function ToastBanner({ message, type = 'info' }: Props) {
  const show = usePillStore(s => s.show)
  useEffect(() => {
    const pillType = type === 'success' ? 'success' : type === 'error' ? 'error' : 'default'
    show(message, pillType)
  }, [message])
  return null
}
