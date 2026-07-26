import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_FLYER_THEME_KEY } from '@/constants/flyerThemes'

// Remembers a host's last-picked flyer theme so repeat shares (e.g. across
// several of their own events) stay visually consistent without re-picking.
interface FlyerThemeStore {
  themeKey: string
  setThemeKey: (key: string) => void
}

export const useFlyerThemeStore = create<FlyerThemeStore>()(
  persist(
    (set) => ({
      themeKey: DEFAULT_FLYER_THEME_KEY,
      setThemeKey: (key) => set({ themeKey: key }),
    }),
    { name: 'vybe-flyer-theme', storage: createJSONStorage(() => AsyncStorage) }
  )
)
