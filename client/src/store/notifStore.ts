import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LAST_SEEN_KEY = 'notif_last_seen_count'

interface NotifState {
  unreadCount: number
  /** Bumped only when a fetch reveals a genuinely NEW unread notification
   *  (count higher than what we last acknowledged) — components watch this
   *  to fire the attention-grabbing pop animation exactly once per new
   *  arrival, not on every app open/focus. */
  popNonce: number
  hydrated: boolean
  lastSeenCount: number
  hydrate: () => Promise<void>
  /** Use this instead of directly setting unreadCount — it's what decides
   *  whether the fresh count represents "new since last time" and bumps
   *  popNonce accordingly. */
  syncUnreadCount: (fresh: number) => void
  markAllRead: () => void
}

export const useNotifStore = create<NotifState>((set, get) => ({
  unreadCount: 0,
  popNonce: 0,
  hydrated: false,
  lastSeenCount: 0,

  hydrate: async () => {
    if (get().hydrated) return
    try {
      const raw = await AsyncStorage.getItem(LAST_SEEN_KEY)
      set({ lastSeenCount: raw ? parseInt(raw, 10) || 0 : 0, hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },

  syncUnreadCount: (fresh) => {
    const { hydrated, lastSeenCount } = get()
    set({ unreadCount: fresh })
    // Only pop once we've actually loaded what the user last saw — before
    // that, `lastSeenCount` defaults to 0 and would falsely fire the pop
    // for pre-existing unread notifications on a fresh install/first run.
    if (hydrated && fresh > lastSeenCount) {
      set(s => ({ popNonce: s.popNonce + 1 }))
    }
    if (fresh !== lastSeenCount) {
      set({ lastSeenCount: fresh })
      AsyncStorage.setItem(LAST_SEEN_KEY, String(fresh)).catch(() => {})
    }
  },

  markAllRead: () => {
    set({ unreadCount: 0, lastSeenCount: 0 })
    AsyncStorage.setItem(LAST_SEEN_KEY, '0').catch(() => {})
  },
}))
