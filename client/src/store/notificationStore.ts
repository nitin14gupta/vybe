import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Permission = 'undecided' | 'granted' | 'denied'

interface NotificationStore {
  permission: Permission
  registeredToken: string | null
  setPermission: (p: Permission) => void
  setRegisteredToken: (t: string | null) => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      permission: 'undecided',
      registeredToken: null,
      setPermission: (p) => set({ permission: p }),
      setRegisteredToken: (t) => set({ registeredToken: t }),
    }),
    {
      name: 'vybe-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
