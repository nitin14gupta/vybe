import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface LastPaymentStore {
  lastPackageName: string | null
  setLastPackageName: (pkg: string) => void
}

export const useLastPaymentStore = create<LastPaymentStore>()(
  persist(
    (set) => ({
      lastPackageName: null,
      setLastPackageName: (pkg) => set({ lastPackageName: pkg }),
    }),
    { name: 'vybe-last-payment', storage: createJSONStorage(() => AsyncStorage) }
  )
)
