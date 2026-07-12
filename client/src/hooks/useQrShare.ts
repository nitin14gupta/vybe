import { useRef } from 'react'
import { View, Share } from 'react-native'
import { captureRef } from 'react-native-view-shot'
import { Asset as MediaAsset, requestPermissionsAsync as requestMediaPermissionsAsync } from 'expo-media-library'
import { hSuccess } from '@/lib/haptics'
import { useImageShare } from '@/hooks/useImageShare'
import { usePillStore } from '@/store/pillStore'

// Share/save behavior for any capturable card (QR codes, tickets, etc).
// Give it the ref of the View you want captured plus the text to share
// alongside it — it handles the native share sheet and "save to Photos" flow.
export function useQrShare(shareMessage: string) {
  const cardRef = useRef<View>(null)
  const { shareImage } = useImageShare()
  const showPill = usePillStore(s => s.show)

  const handleShare = async () => {
    const result = await shareImage(cardRef, { message: shareMessage })
    if (result.shared || result.error === 'cancelled') return
    await Share.share({ message: shareMessage })
  }

  const handleSave = async () => {
    if (!cardRef.current) return
    try {
      const { status } = await requestMediaPermissionsAsync()
      if (status !== 'granted') {
        showPill('Allow photo access to save this', 'error')
        return
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 })
      await MediaAsset.create(uri)
      hSuccess()
      showPill('Saved to Photos!', 'default')
    } catch {
      showPill("Couldn't save, try again", 'error')
    }
  }

  return { cardRef, handleShare, handleSave }
}
