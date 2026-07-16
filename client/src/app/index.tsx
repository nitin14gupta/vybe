import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/auth'

export default function Index() {
  const { isAuthenticated, profileComplete } = useAuthStore()

  if (!isAuthenticated) return <Redirect href="/(auth)/" />
  if (!profileComplete) return <Redirect href="/(onboarding)" />
  return <Redirect href="/(tabs)" />
}