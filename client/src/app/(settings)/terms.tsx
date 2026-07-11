import { router } from 'expo-router'
import { InAppBrowserModal } from '@/components/ui'
import { TERMS_URL } from '@/constants'

export default function TermsScreen() {
  return <InAppBrowserModal visible url={TERMS_URL} onClose={() => router.back()} />
}
