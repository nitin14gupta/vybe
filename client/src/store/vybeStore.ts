import { create } from 'zustand'

interface VybeStore {
  pendingTargets: Record<string, true>
  markSent: (userId: string) => void
  markCleared: (userId: string) => void
  isSentTo: (userId: string) => boolean
}

export const useVybeStore = create<VybeStore>((set, get) => ({
  pendingTargets: {},
  markSent: (userId) =>
    set(s => ({ pendingTargets: { ...s.pendingTargets, [userId]: true } })),
  markCleared: (userId) =>
    set(s => {
      const next = { ...s.pendingTargets }
      delete next[userId]
      return { pendingTargets: next }
    }),
  isSentTo: (userId) => !!get().pendingTargets[userId],
}))
