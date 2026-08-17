import React, { useEffect, useRef } from 'react'
import { Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import { Share2, UserCircle2, Ghost } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { parseServerDate } from '@/lib/dates'
import { useImageShare } from '@/hooks/useImageShare'
import { buildEventShareUrl } from '@/lib/deepLink'
import { formatDateTime } from './eventDetailUtils'
import { EventShareCard } from './EventShareCard'
import type { EventSummary } from '@/api/apiService'

function formatEventDate(iso: string | null | undefined) {
  const d = parseServerDate(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function renderPeekBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.5} />
}

interface CoreProps {
  event: EventSummary
  onClose: () => void
}

function EventQuickPeekSheetCore({ event, onClose }: CoreProps) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const shareCardRef = useRef<View>(null)
  const router = useRouter()
  const myId = useAuthStore(state => state.userId)
  const showPill = usePillStore(s => s.show)
  const { shareImage } = useImageShare()
  const coverUrl = event.cover_photos?.[0]?.url
  useEffect(() => { sheetRef.current?.present() }, [])

  // Same "classic" poster (image + title + date) that's the first slide in
  // EventShareSheet on the event detail screen — captured and shared as one
  // image, not a plain text share.
  const handleShare = async () => {
    hTap()
    if (!coverUrl) {
      onClose()
      const message = `Check out "${event.title}" on Gorave!\n${formatEventDate(event.date_time)}${event.location_name ? `\n📍 ${event.location_name}` : ''}`
      Share.share({ message, title: event.title }).catch(() => {})
      return
    }
    const dateTimeLabel = formatDateTime(event.date_time)
    const message = `I'm going to "${event.title}"! 🎉\n${dateTimeLabel}\n${buildEventShareUrl(event.id)}`
    const result = await shareImage(shareCardRef, { message, title: event.title })
    if (!result.shared && result.error === 'failed') showPill("Couldn't share, try again", 'error')
  }

  const handleViewHost = () => {
    hTap()
    onClose()
    if (!event.host_id) return
    router.push((event.host_id === myId ? '/(tabs)/profile' : `/(profile)/${event.host_id}`) as any)
  }

  return (
    <>
    {/* Off-screen — never shown, just captured and shared as an image when
        "Share Event" is tapped. Same card used by the detail screen's share sheet. */}
    {coverUrl && (
      <View style={s.shareCardHost} pointerEvents="none">
        <EventShareCard
          ref={shareCardRef}
          imageUrl={coverUrl}
          title={event.title}
          dateTimeLabel={formatDateTime(event.date_time)}
        />
      </View>
    )}
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={[event.host_name && !event.host_is_deleted ? '38%' : '26%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderPeekBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <View style={s.previewRow}>
          {event.cover_photos?.[0]?.url ? (
            <Image source={{ uri: event.cover_photos[0].url }} style={s.previewImg} contentFit="cover" cachePolicy="memory-disk" transition={150} />
          ) : (
            <View style={[s.previewImg, s.previewImgFallback]} />
          )}
          <View style={s.previewText}>
            <Text style={s.previewTitle} numberOfLines={2}>{event.title}</Text>
            <Text style={s.previewSub} numberOfLines={1}>{formatEventDate(event.date_time)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <Pressable style={s.item} onPress={handleShare}>
          <Share2 size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
          <Text style={s.itemText}>Share Event</Text>
        </Pressable>

        {event.host_name && !event.host_is_deleted ? (
          <Pressable style={s.item} onPress={handleViewHost}>
            {event.host_is_deleted ? (
              <Ghost size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
            ) : (
              <UserCircle2 size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
            )}
            <Text style={s.itemText}>View {event.host_id === myId ? 'Your' : `${event.host_name}'s`} Profile</Text>
          </Pressable>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
    </>
  )
}

interface Props extends CoreProps {
  visible: boolean
}

export function EventQuickPeekSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <EventQuickPeekSheetCore {...rest} />
}

const s = StyleSheet.create({
  shareCardHost: { position: 'absolute', top: 0, left: -9999 },
  bg: { backgroundColor: Colors.surface },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.2) },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  previewImg: { width: 52, height: 52, borderRadius: 12 },
  previewImgFallback: { backgroundColor: Colors.surfaceMuted },
  previewText: { flex: 1, gap: 3 },
  previewTitle: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary },
  previewSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  itemText: { fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
})
