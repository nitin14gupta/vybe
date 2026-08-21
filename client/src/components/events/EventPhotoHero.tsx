import { useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { ArrowLeft, Bookmark, Flag, MoreVertical, Share2 } from 'lucide-react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { Colors, EVENT_ICONS, EVENT_ICON_FALLBACK, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import { useHotlistToggle } from '@/hooks/useHotlistToggle'
import { isEventPast } from '@/lib/dates'
import { StepDots } from '@/components/ui/StepDots'
import type { EventDetail } from '@/api/apiService'

const { width: W } = Dimensions.get('window')
export const HERO_HEIGHT = W * (9 / 16) // true 16:9 — matches EventCard's cover crop

interface Props {
  event: EventDetail
  isHost: boolean
  topInset: number
  onBack: () => void
  onShare: () => void
  onOptions: () => void
  onReport: () => void
}

export function EventPhotoHero({ event, isHost, topInset, onBack, onShare, onOptions, onReport }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const coverPhotos = event.cover_photos ?? []
  const { hotlisted, toggle: toggleHotlist } = useHotlistToggle(event.id, event.is_hotlisted)
  const eventIsPast = isEventPast(event)

  const bookmarkScale = useSharedValue(1)
  const bookmarkMounted = useRef(false)
  useEffect(() => {
    if (!bookmarkMounted.current) {
      bookmarkMounted.current = true
      return
    }
    bookmarkScale.value = withSequence(
      withTiming(1.15, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) })
    )
  }, [hotlisted])
  const bookmarkStyle = useAnimatedStyle(() => ({ transform: [{ scale: bookmarkScale.value }] }))

  return (
    <View style={styles.hero}>
      {coverPhotos.length > 0 ? (
        <>
          <FlatList
            data={coverPhotos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={e => {
              setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / W))
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={{ width: W, height: HERO_HEIGHT }}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
                transition={150}
              />
            )}
          />
          {coverPhotos.length > 1 && (
            <StepDots step={photoIdx + 1} total={coverPhotos.length} variant="overlay" />
          )}
        </>
      ) : (
        <LinearGradient
          colors={[Colors.surface, Colors.background]}
          style={[{ width: W, height: HERO_HEIGHT }, styles.heroPlaceholder]}
        >
          {(() => {
            const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK
            return <TypeIcon size={44} color={Colors.inkDisabled} strokeWidth={1.5} />
          })()}
        </LinearGradient>
      )}

      {/* Scrim — keeps overlay icons legible over any photo, without per-icon circles */}
      <LinearGradient
        colors={[withOpacity(Colors.background, 0.55), withOpacity(Colors.background, 0)]}
        style={[styles.heroScrim, { height: topInset + 72 }]}
        pointerEvents="none"
      />

      {/* Overlay buttons */}
      <View style={[styles.heroOverlay, { top: topInset + 8 }]}>
        <Pressable style={styles.heroIconBtn} onPress={onBack} hitSlop={10}>
          <ArrowLeft size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {!eventIsPast && (
            <Pressable style={styles.heroIconBtn} onPress={toggleHotlist} hitSlop={10}>
              <Animated.View style={bookmarkStyle}>
                <Bookmark
                  size={20}
                  color={hotlisted ? Colors.brandOrange : Colors.inkPrimary}
                  fill={hotlisted ? Colors.brandOrange : 'transparent'}
                  strokeWidth={2}
                />
              </Animated.View>
            </Pressable>
          )}
          <Pressable style={styles.heroIconBtn} onPress={() => { hTap(); onShare() }} hitSlop={10}>
            <Share2 size={20} color={Colors.inkPrimary} strokeWidth={2} />
          </Pressable>
          {isHost ? (
            <Pressable style={styles.heroIconBtn} onPress={() => { hTap(); onOptions() }} hitSlop={10}>
              <MoreVertical size={20} color={Colors.inkPrimary} strokeWidth={2} />
            </Pressable>
          ) : (
            <Pressable style={styles.heroIconBtn} onPress={() => { hTap(); onReport() }} hitSlop={10}>
              <Flag size={20} color={Colors.inkPrimary} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: { height: HERO_HEIGHT, backgroundColor: Colors.surface },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroScrim: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
