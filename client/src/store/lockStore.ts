import { create } from 'zustand'

interface LockState {
  locked: boolean
  reason: string
  lock: (reason: string) => void
  reset: () => void
}

// No `hide`/`dismiss` on purpose — the account-locked sheet is non-dismissable
// except by logging out (see AccountLockedOverlay).
export const useLockStore = create<LockState>((set) => ({
  locked: false,
  reason: '',
  lock: (reason) => set({ locked: true, reason }),
  reset: () => set({ locked: false, reason: '' }),
}))
