import { useAuth } from '@/hooks/useAuth'
import { APP_VERSION } from '@/constants'

export function useSettings() {
  const { handleLogout } = useAuth()

  return {
    appVersion: APP_VERSION,
    handleLogout,
  }
}
