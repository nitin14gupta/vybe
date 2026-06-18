import { create } from 'zustand'

interface NotifState {
  unreadCount: number
  setUnreadCount: (n: number) => void
  markAllRead: () => void
}

export const useNotifStore = create<NotifState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
  markAllRead: () => set({ unreadCount: 0 }),
}))
