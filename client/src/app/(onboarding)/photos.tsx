import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { hTap, hError } from '@/lib/haptics'
import { Camera, X, Plus, AlertCircle, Crown } from 'lucide-react-native'
import { SortableGrid, SortableGridItem, GridStrategy } from 'react-native-reanimated-dnd'
import type { SortableGridRenderItemProps, GridPositions } from 'react-native-reanimated-dnd'
import { OutlineButton, ProgressBar, PrimaryButton, Screen } from '@/components/ui'
import { usePhotos } from '@/hooks/usePhotos'
import type { PhotoItem } from '@/hooks/usePhotos'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const COL_GAP = 10
const ITEM_SIZE = Math.floor((SCREEN_WIDTH - Spacing.screenPadding * 2 - COL_GAP) / 2)

export default function PhotosScreen() {
  const {
    items,
    nextLoading,
    hasAnyPhoto,
    onSlotPress,
    retryUpload,
    removePhoto,
    handleNext,
    handleDrop,
  } = usePhotos()

  const renderItem = ({
    item,
    index,
    id,
    ...rest
  }: SortableGridRenderItemProps<PhotoItem>) => {
    const isMain = index === 0
    const isDone = item.state === 'done'
    const isUploading = item.state === 'uploading'
    const isError = item.state === 'error'

    const onDrop = (_id: string, _pos: number, allPositions?: GridPositions) =>
      handleDrop(_id, _pos, allPositions)

    return (
      <SortableGridItem
        key={id}
        id={id}
        data={item}
        {...rest}
        // block drag while uploading / in error — keep a tactile delay for done slots
        activationDelay={isDone ? 350 : 99999}
        onDrop={onDrop}
        style={styles.itemWrapper}
      >
        <Pressable
          onPress={() => { hTap(); onSlotPress(index) }}
          style={[styles.slot, isMain && !!item.uri && styles.slotMain]}
        >
          {item.uri ? (
            <>
              <Image
                source={{ uri: item.uri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />

              {isUploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}

              {isError && (
                <Pressable onPress={() => retryUpload(index)} style={styles.errorOverlay}>
                  <AlertCircle size={18} color="#fff" />
                  <Text style={styles.retryTxt}>Tap to retry</Text>
                </Pressable>
              )}

              {isDone && (
                <Pressable
                  onPress={() => { hError(); removePhoto(index) }}
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
      </SortableGridItem>
    )
  }

  return (
    <Screen>
      <ProgressBar step={2} />

      <View style={styles.header}>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>Add at least 1 · Hold &amp; drag to reorder</Text>
      </View>

      <SortableGrid
        data={items}
        renderItem={renderItem}
        strategy={GridStrategy.Swap}
        dimensions={{
          columns: 2,
          itemWidth: ITEM_SIZE,
          itemHeight: ITEM_SIZE,
          rowGap: COL_GAP,
          columnGap: COL_GAP,
        }}
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
      />

      <View style={styles.footer}>
        <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.nextBtn}>
          <PrimaryButton
            label="Next →"
            onPress={handleNext}
            disabled={!hasAnyPhoto}
            loading={nextLoading}
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 12 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    letterSpacing: -0.24,
    color: Colors.inkPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },

  grid: { flex: 1 },
  gridContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  itemWrapper: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  slot: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: Radius.card,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotMain: {
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.35)',
  },

  emptyMain: { alignItems: 'center', gap: 10 },
  cameraCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,107,53,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },

  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  mainBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.8,
  },

  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(192,57,43,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  retryTxt: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FontFamily.bodyMedium,
  },
  removeBtn: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  backBtn: { width: 96 },
  nextBtn: { flex: 1 },
})
