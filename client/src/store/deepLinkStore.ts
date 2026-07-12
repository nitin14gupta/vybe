import { create } from 'zustand'
import { DeepLinkTarget } from '@/lib/deepLink'

interface DeepLinkState {
  pendingTarget: DeepLinkTarget | null
  setPending: (t: DeepLinkTarget) => void
  clearPending: () => void
}

export const useDeepLinkStore = create<DeepLinkState>((set) => ({
  pendingTarget: null,
  setPending: (t) => set({ pendingTarget: t }),
  clearPending: () => set({ pendingTarget: null }),
}))
