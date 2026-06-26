import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const MAX = 10

export interface SearchHistoryUser {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
}

interface SearchHistoryStore {
  history: SearchHistoryUser[]
  add: (user: SearchHistoryUser) => void
  remove: (id: string) => void
  clear: () => void
}

export const useSearchHistoryStore = create<SearchHistoryStore>()(
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
    { name: 'vybe-search-history', storage: createJSONStorage(() => AsyncStorage) }
  )
)
