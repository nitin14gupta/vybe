import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type EventViewMode = 'card' | 'list'

interface EventViewModeStore {
  mode: EventViewMode
  setMode: (mode: EventViewMode) => void
}

export const useEventViewModeStore = create<EventViewModeStore>()(
  persist(
    (set) => ({
      mode: 'card',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'vybe-event-view-mode', storage: createJSONStorage(() => AsyncStorage) },
  ),
)
