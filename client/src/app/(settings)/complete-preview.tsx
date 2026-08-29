import { router } from 'expo-router'
import { OnboardingCompleteView } from '@/components/onboarding/OnboardingCompleteView'

// Dev-only shortcut to the onboarding "all set" screen — lets us tweak its
// look without logging out and running through onboarding every time.
export default function CompletePreviewScreen() {
  return (
    <OnboardingCompleteView
      name="Alex"
      onExplore={() => router.back()}
      exploreLabel="Close Preview"
    />
  )
}
