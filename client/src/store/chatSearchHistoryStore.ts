import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const MAX = 10
export interface ChatSearchHistoryEntry {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
}

interface ChatSearchHistoryStore {
  history: ChatSearchHistoryEntry[]
  add: (user: ChatSearchHistoryEntry) => void
  remove: (id: string) => void
  clear: () => void
}

export const useChatSearchHistoryStore = create<ChatSearchHistoryStore>()(
  persist(
    (set) => ({
      history: [],
      add: (user) =>
        set((s) => ({
          history: [user, ...s.history.filter((h) => h.id !== user.id)].slice(0, MAX),
        })),
      remove: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
      clear: () => set({ history: [] }),
    }),
    { name: 'vybe-chat-search-history', storage: createJSONStorage(() => AsyncStorage) }
  )
)
