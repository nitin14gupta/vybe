import { create } from 'zustand'

interface NetworkState {
  online: boolean
  setOnline: (online: boolean) => void
}

// Defaults to true so the banner never flashes on mount before the first
// NetInfo event arrives.
export const useNetworkStore = create<NetworkState>((set) => ({
  online: true,
  setOnline: (online) => set({ online }),
}))
