import { create } from 'zustand'

type PillType = 'default' | 'success' | 'error'

interface PillState {
  message: string
  visible: boolean
  type: PillType
  show: (msg: string, type?: PillType) => void
  hide: () => void
}

export const usePillStore = create<PillState>((set) => ({
  message: '',
  visible: false,
  type: 'default',
  show: (msg, type = 'default') => set({ message: msg, visible: true, type }),
  hide: () => set({ visible: false }),
}))
