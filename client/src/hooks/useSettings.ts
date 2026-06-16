import Constants from 'expo-constants'
import { useAuth } from '@/hooks/useAuth'

export function useSettings() {
  const { handleLogout } = useAuth()
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  return {
    appVersion,
    handleLogout,
  }
}
