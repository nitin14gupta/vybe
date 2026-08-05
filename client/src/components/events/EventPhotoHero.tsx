import React, { useState } from 'react'
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { ArrowLeft, Flag, MoreVertical, Share2 } from 'lucide-react-native'
import { Colors, EVENT_ICONS, EVENT_ICON_FALLBACK } from '@/constants'
import { hTap } from '@/lib/haptics'
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
            <View style={styles.photoDots}>
              {coverPhotos.map((_, i) => (
                <View key={i} style={[styles.photoDot, i === photoIdx && styles.photoDotActive]} />
              ))}
            </View>
          )}
        </>
      ) : (
        <LinearGradient
          colors={['#1A1A1A', '#111111']}
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
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        style={[styles.heroScrim, { height: topInset + 72 }]}
        pointerEvents="none"
      />

      {/* Overlay buttons */}
      <View style={[styles.heroOverlay, { top: topInset + 8 }]}>
        <Pressable style={styles.heroIconBtn} onPress={onBack} hitSlop={10}>
          <ArrowLeft size={22} color="#fff" strokeWidth={2} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable style={styles.heroIconBtn} onPress={() => { hTap(); onShare() }} hitSlop={10}>
            <Share2 size={20} color="#fff" strokeWidth={2} />
          </Pressable>
          {isHost ? (
            <Pressable style={styles.heroIconBtn} onPress={() => { hTap(); onOptions() }} hitSlop={10}>
              <MoreVertical size={20} color="#fff" strokeWidth={2} />
            </Pressable>
          ) : (
            <Pressable style={styles.heroIconBtn} onPress={() => { hTap(); onReport() }} hitSlop={10}>
              <Flag size={20} color="#fff" strokeWidth={2} />
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
  photoDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  photoDotActive: { backgroundColor: '#fff', width: 18 },
})
