import { router } from 'expo-router'
import { InAppBrowserModal } from '@/components/ui'
import { PRIVACY_URL } from '@/constants'

export default function PrivacyScreen() {
  return <InAppBrowserModal visible url={PRIVACY_URL} onClose={() => router.back()} />
}
