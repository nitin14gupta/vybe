import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Pressable, Dimensions, InteractionManager,
} from 'react-native'
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { LinearGradient } from 'expo-linear-gradient'
import { Download, Share2, MessageCircle } from 'lucide-react-native'
import { captureRef } from 'react-native-view-shot'
import { Asset as MediaAsset, requestPermissionsAsync as requestMediaPermissionsAsync } from 'expo-media-library'
import { hTap, hSuccess, hSelection } from '@/lib/haptics'
import { useImageShare } from '@/hooks/useImageShare'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily, FLYER_THEMES, type FlyerTheme, withOpacity } from '@/constants'
import { useFlyerThemeStore } from '@/store/flyerThemeStore'
import { EventShareCard, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from '@/components/events/EventShareCard'
import { EventQrShareCard } from '@/components/events/EventQrShareCard'
import { EventFlyerShareCard } from '@/components/events/EventFlyerShareCard'
import { ShareToChatSheet } from './ShareToChatSheet'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_GAP = 14
const SIDE_INSET = (SCREEN_W - SHARE_CARD_WIDTH) / 2
const SWATCH_ROW_HEIGHT = 44
const SHEET_HEIGHT = 8 + 64 + SHARE_CARD_HEIGHT + SWATCH_ROW_HEIGHT + 30 + 118 + 24

interface Props {
  visible: boolean
  onClose: () => void
  eventId: string
  title: string
  dateTimeLabel: string
  coverUrl?: string | null
  shareUrl: string
  hostName?: string | null
  hostAvatarUrl?: string | null
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

function ThemeSwatch({ theme, active, onPress }: { theme: FlyerTheme; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {/* The ring's borderColor toggles (transparent <-> ink) but the border
          property itself is always present — Android can fail to repaint a
          view that has overflow:'hidden' + a native gradient child when
          borderWidth is added/removed on that SAME node, leaving it blank
          until the next full layout. Keeping the clipped/gradient view's
          style 100% constant and putting the toggle on this outer ring
          instead sidesteps that entirely. */}
      <View style={[s.swatchRing, active ? s.swatchRingActive : s.swatchRingIdle]}>
        <View style={s.swatchOrb}>
          <LinearGradient
            colors={[theme.swatchGlow, theme.bgDeep]}
            start={{ x: 0.15, y: 0.1 }}
            end={{ x: 0.9, y: 1 }}
            style={s.swatchFill}
          >
            <View style={s.swatchGloss} />
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  )
}

function EventShareSheetCore({ onClose, eventId, title, dateTimeLabel, coverUrl, shareUrl, hostName, hostAvatarUrl }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [chatShareOpen, setChatShareOpen] = useState(false)
  const [heavySlidesReady, setHeavySlidesReady] = useState(false)
  const transitioning = useRef(false)
  const showPill = usePillStore(s => s.show)
  const { shareImage } = useImageShare()

  const classicRef = useRef<View>(null)
  const qrRef = useRef<View>(null)
  const flyerRef = useRef<View>(null)
  // No cover photo → drop the photo-based slides, keep only the QR one
  const refs = coverUrl ? [classicRef, qrRef, flyerRef] : [qrRef]
  const slideTitles = coverUrl ? ['Share Event', 'Share QR', 'Share Flyer'] : ['Share QR']
  const slideCount = refs.length

  const message = `I'm going to "${title}"! 🎉\n${dateTimeLabel}\n${shareUrl}`

  useEffect(() => { sheetRef.current?.present() }, [])

  // The classic + flyer slides each decode a full-size network image plus a
  // gradient/text overlay — mounting both eagerly alongside the sheet's own
  // spring-open animation is what causes the lag. Same fix as StyledQr's own
  // defer (see QrCard.tsx): let the sheet finish opening first, then mount
  // the heavy slides a beat later. The QR slide stays untouched — it's cheap
  // and already defers its own internal render.
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setHeavySlidesReady(true))
    return () => task.cancel()
  }, [])

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (SHARE_CARD_WIDTH + CARD_GAP))
    setActiveIndex(Math.max(0, Math.min(slideCount - 1, idx)))
  }

  const activeRef = refs[activeIndex] ?? refs[0]
  const isFlyerSlide = !!coverUrl && activeIndex === refs.length - 1
  const flyerThemeKey = useFlyerThemeStore(st => st.themeKey)
  const setFlyerThemeKey = useFlyerThemeStore(st => st.setThemeKey)

  const handleShare = async () => {
    hTap()
    const result = await shareImage(activeRef, { message, title })
    if (!result.shared && result.error === 'failed') showPill("Couldn't share, try again", 'error')
  }

  const handleDismiss = () => {
    if (transitioning.current) { transitioning.current = false; return }
    onClose()
  }

  const openChatShare = () => {
    hTap()
    transitioning.current = true
    setChatShareOpen(true)
    sheetRef.current?.dismiss()
  }

  const handleSave = async () => {
    hTap()
    if (!activeRef.current) return
    try {
      const { status } = await requestMediaPermissionsAsync()
      if (status !== 'granted') {
        showPill('Allow photo access to save this', 'error')
        return
      }
      const uri = await captureRef(activeRef, { format: 'png', quality: 1 })
      await MediaAsset.create(uri)
      hSuccess()
      showPill('Saved to Photos!', 'default')
    } catch {
      showPill("Couldn't save, try again", 'error')
    }
  }

  return (
    <>
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={[SHEET_HEIGHT]}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
      failOffsetX={[-15, 15]}
    >
      <BottomSheetView style={s.content}>
        <Text style={s.title}>{slideTitles[activeIndex] ?? slideTitles[0]}</Text>
        <Text style={s.subtitle}>Post to socials or send with the link</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SHARE_CARD_WIDTH + CARD_GAP}
          contentContainerStyle={{ paddingHorizontal: SIDE_INSET, gap: CARD_GAP }}
          onMomentumScrollEnd={onScrollEnd}
          style={s.carousel}
        >
          {coverUrl && (
            heavySlidesReady ? (
              <EventShareCard
                ref={classicRef}
                imageUrl={coverUrl}
                title={title}
                dateTimeLabel={dateTimeLabel}
              />
            ) : <View style={s.slidePlaceholder} />
          )}
          <EventQrShareCard
            ref={qrRef}
            data={shareUrl}
            title={title}
            dateTimeLabel={dateTimeLabel}
          />
          {coverUrl && (
            heavySlidesReady ? (
              <EventFlyerShareCard
                ref={flyerRef}
                imageUrl={coverUrl}
                title={title}
                dateTimeLabel={dateTimeLabel}
                shareUrl={shareUrl}
                hostName={hostName}
                hostAvatarUrl={hostAvatarUrl}
              />
            ) : <View style={s.slidePlaceholder} />
          )}
        </ScrollView>

        <View style={s.swatchRow}>
          {isFlyerSlide && (
            <View style={s.swatchTrack}>
              {FLYER_THEMES.map(t => (
                <ThemeSwatch
                  key={t.key}
                  theme={t}
                  active={flyerThemeKey === t.key}
                  onPress={() => { hSelection(); setFlyerThemeKey(t.key) }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={s.dots}>
          {Array.from({ length: slideCount }).map((_, i) => (
            <View key={i} style={[s.dot, i === activeIndex && s.dotActive]} />
          ))}
        </View>

        <View style={s.actionsRow}>
          <Pressable style={s.actionBtn} onPress={handleSave}>
            <View style={s.actionIcon}><Download size={22} color={Colors.white} strokeWidth={2} /></View>
            <Text style={s.actionLabel}>Save</Text>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={handleShare}>
            <View style={[s.actionIcon, s.actionIconOutline]}><Share2 size={20} color={Colors.inkPrimary} strokeWidth={2} /></View>
            <Text style={s.actionLabel}>Share</Text>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={openChatShare}>
            <View style={[s.actionIcon, s.actionIconOutline]}><MessageCircle size={20} color={Colors.inkPrimary} strokeWidth={2} /></View>
            <Text style={s.actionLabel}>Chat</Text>
          </Pressable>
        </View>

        <View style={{ height: 16 }} />
      </BottomSheetView>
    </BottomSheetModal>

    <ShareToChatSheet
      visible={chatShareOpen}
      onClose={() => { setChatShareOpen(false); onClose() }}
      contentType="event"
      metadata={{ event_id: eventId, title, date: dateTimeLabel, cover_url: coverUrl ?? null }}
      previewTitle={title}
      previewSubtitle={dateTimeLabel}
      previewImage={coverUrl}
    />
    </>
  )
}

export function EventShareSheet(props: Props) {
  if (!props.visible) return null
  return <EventShareSheetCore {...props} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated },
  handle: { backgroundColor: withOpacity(Colors.white, 0.18) },
  content: { paddingTop: 8, paddingBottom: 0, alignItems: 'center' },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.inkPrimary,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  carousel: { width: '100%', height: SHARE_CARD_HEIGHT, flexGrow: 0 },
  slidePlaceholder: {
    width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT,
    borderRadius: 20, backgroundColor: Colors.surface,
  },
  swatchRow: {
    height: SWATCH_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    // backgroundColor: withOpacity(Colors.white, 0.05),
  },
  swatchRing: {
    borderRadius: 19,
    borderWidth: 1,
  },
  swatchRingIdle: {
    borderColor: 'transparent',
  },
  swatchRingActive: {
    borderColor: Colors.inkPrimary,
  },
  swatchOrb: {
    width: 26,
    height: 26,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  swatchFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  swatchGloss: {
    position: 'absolute',
    top: 3,
    left: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: withOpacity(Colors.white, 0.4),
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
  },
  dotActive: {
    backgroundColor: Colors.inkPrimary,
    width: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 26,
  },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: withOpacity(Colors.white, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  actionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
})
