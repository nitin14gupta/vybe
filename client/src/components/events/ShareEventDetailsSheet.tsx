import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import RNShare from 'react-native-share'
import { Calendar, MapPin, User } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Colors, FontFamily, withOpacity } from '@/constants'

interface Props {
  visible: boolean
  onClose: () => void
  title: string
  dateTimeLabel: string
  locationName?: string | null
  hostName?: string | null
  shareUrl: string
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

function ShareEventDetailsSheetCore({ onClose, title, dateTimeLabel, locationName, hostName, shareUrl }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const showPill = usePillStore(s => s.show)

  useEffect(() => { sheetRef.current?.present() }, [])

  const handleShare = async () => {
    hTap()
    const lines = [
      `You're attending: ${title}`,
      `📅 ${dateTimeLabel}`,
      locationName ? `📍 ${locationName}` : null,
      hostName ? `👤 Hosted by ${hostName}` : null,
      '',
      shareUrl,
    ].filter((l): l is string => l != null)

    try {
      await RNShare.open({ message: lines.join('\n'), failOnCancel: false })
    } catch (e: any) {
      const cancelled = typeof e?.message === 'string' && e.message.toLowerCase().includes('cancel')
      if (!cancelled) showPill("Couldn't open share sheet, try again", 'error')
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <BottomSheetView style={s.content}>
        <Text style={s.title}>Share this event</Text>
        <Text style={s.subtitle}>Send your trusted contact the details of the event you're attending.</Text>

        <View style={s.preview}>
          <Text style={s.previewLabel}>You're attending</Text>
          <Text style={s.previewTitle} numberOfLines={2}>{title}</Text>
          <View style={s.previewRow}>
            <Calendar size={14} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={s.previewText} numberOfLines={1}>{dateTimeLabel}</Text>
          </View>
          {locationName ? (
            <View style={s.previewRow}>
              <MapPin size={14} color={Colors.inkSecondary} strokeWidth={2} />
              <Text style={s.previewText} numberOfLines={1}>{locationName}</Text>
            </View>
          ) : null}
          {hostName ? (
            <View style={s.previewRow}>
              <User size={14} color={Colors.inkSecondary} strokeWidth={2} />
              <Text style={s.previewText} numberOfLines={1}>Hosted by {hostName}</Text>
            </View>
          ) : null}
        </View>

        <PrimaryButton label="Share" onPress={handleShare} style={s.shareBtn} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function ShareEventDetailsSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ShareEventDetailsSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8, gap: 6 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, textAlign: 'center' },
  subtitle: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: 6,
  },
  preview: {
    backgroundColor: Colors.elevated,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginTop: 4,
  },
  previewLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.6,
    color: Colors.inkSecondary, textTransform: 'uppercase',
  },
  previewTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginBottom: 2 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewText: { fontFamily: FontFamily.bodyRegular, fontSize: 13.5, color: Colors.inkSecondary, flexShrink: 1 },
  shareBtn: { marginTop: 14 },
})
