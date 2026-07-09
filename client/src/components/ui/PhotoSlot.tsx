import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { hTap, hError } from '@/lib/haptics'
import { Camera, X, Plus, AlertCircle, Crown } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export type SlotState = 'idle' | 'uploading' | 'done' | 'error'

export interface PhotoItem {
  id: string
  uri: string | null
  state: SlotState
  serverUrl: string | null
  remoteId?: string
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const COL_GAP = 10
export const ITEM_SIZE = Math.floor((SCREEN_WIDTH - Spacing.screenPadding * 2 - COL_GAP) / 2)

export function PhotoSlot({
  item,
  index,
  onSlotPress,
  retryUpload,
  removePhoto,
}: {
  item: PhotoItem
  index: number
  onSlotPress: (id: string) => void
  retryUpload: (id: string) => void
  removePhoto: (id: string) => void
}) {
  const isMain = index === 0
  const isDone = item.state === 'done'
  const isUploading = item.state === 'uploading'
  const isError = item.state === 'error'

  return (
    <Pressable
      onPress={() => { hTap(); onSlotPress(item.id) }}
      style={[styles.slot, isMain && !!item.uri && styles.slotMain]}
    >
      {item.uri ? (
        <>
          <Image
            source={item.uri}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={120}
          />

          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}

          {isError && (
            <Pressable onPress={() => retryUpload(item.id)} style={styles.errorOverlay}>
              <AlertCircle size={18} color="#fff" />
              <Text style={styles.retryTxt}>Tap to retry</Text>
            </Pressable>
          )}

          {isDone && (
            <Pressable
              onPress={() => { hError(); removePhoto(item.id) }}
              style={styles.removeBtn}
              hitSlop={10}
            >
              <X size={11} color="#fff" strokeWidth={3} />
            </Pressable>
          )}

          {isMain && (
            <View style={styles.mainBadge}>
              <Crown size={9} color={Colors.brandOrange} strokeWidth={2.5} />
              <Text style={styles.mainBadgeText}>MAIN</Text>
            </View>
          )}
        </>
      ) : isMain ? (
        <View style={styles.emptyMain}>
          <View style={styles.cameraCircle}>
            <Camera size={22} color={Colors.inkPrimary} strokeWidth={2} />
          </View>
          <Text style={styles.addLabel}>Add photo</Text>
        </View>
      ) : (
        <Plus size={22} color={Colors.brandOrange} strokeWidth={1.5} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  slot: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotMain: {
    borderColor: Colors.brandOrange,
    borderWidth: 2,
  },
  emptyMain: {
    alignItems: 'center',
    gap: 8,
  },
  cameraCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 60, 60, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  retryTxt: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: '#fff',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  mainBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.brandOrange,
    letterSpacing: 0.5,
  },
})
