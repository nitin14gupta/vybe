import { create } from 'zustand'

interface PermissionSheetState {
  visible: boolean
  title: string
  body: string
  show: (title: string, body: string) => void
  hide: () => void
}

export const usePermissionSheetStore = create<PermissionSheetState>((set) => ({
  visible: false,
  title: '',
  body: '',
  show: (title, body) => set({ title, body, visible: true }),
  hide: () => set({ visible: false }),
}))
