import { create } from 'zustand'
import ApiService from '@/api/apiService'

interface ChatUnreadState {
  unreadCount: number
  setUnreadCount: (n: number) => void
}

export const useChatUnreadStore = create<ChatUnreadState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
}))

export async function syncChatUnreadCount() {
  try {
    const data = await ApiService.getConversations(20, 0)
    const unreadConvos = [...data.active, ...data.locked].filter(c => (c.unread_count || 0) > 0).length
    useChatUnreadStore.getState().setUnreadCount(unreadConvos)
  } catch {
    // Keep whatever count was last known — a transient failure here
    // shouldn't blank out an otherwise-correct badge.
  }
}
