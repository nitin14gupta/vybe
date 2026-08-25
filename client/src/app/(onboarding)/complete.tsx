import { router } from 'expo-router'
import { OnboardingCompleteView } from '@/components/onboarding/OnboardingCompleteView'
import { useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'

export default function CompleteScreen() {
  const store = useOnboardingStore()
  const setProfileComplete = useAuthStore(s => s.setProfileComplete)

  const navigate = () => {
    setProfileComplete(true)
    store.reset()
    router.replace('/(tabs)')
  }

  return <OnboardingCompleteView name={store.name} onExplore={navigate} />
}
