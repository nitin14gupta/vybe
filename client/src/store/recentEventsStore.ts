import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { isEventPast } from '@/lib/dates'
import type { EventSummary } from '@/api/apiService'

const MAX = 10

interface RecentEventsStore {
  events: EventSummary[]
  add: (event: EventSummary) => void
  pruneEnded: () => void
}

export const useRecentEventsStore = create<RecentEventsStore>()(
  persist(
    (set) => ({
      events: [],
      add: (event) =>
        set((s) => ({
          events: [event, ...s.events.filter((e) => e.id !== event.id)]
            .filter((e) => !isEventPast(e))
            .slice(0, MAX),
        })),
      pruneEnded: () =>
        set((s) => ({ events: s.events.filter((e) => !isEventPast(e)) })),
    }),
    { name: 'vybe-recent-events', storage: createJSONStorage(() => AsyncStorage) },
  ),
)
