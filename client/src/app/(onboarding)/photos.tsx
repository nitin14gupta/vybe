import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { OutlineButton, ProgressBar, PrimaryButton, Screen, PhotoSlot } from '@/components/ui'
import { MediaPreviewModal } from '@/components/chat/MediaPreviewModal'
import { usePhotos } from '@/hooks/usePhotos'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import LiquidPlasmaBackground from '@/components/LiquidPlasmaBackground'
import { ITEM_SIZE } from '@/components/ui/PhotoSlot'



export default function PhotosScreen() {
  const {
    items,
    nextLoading,
    hasAnyPhoto,
    onSlotPress,
    removePhoto,
    handleNext,
    pendingMedia,
    confirmPendingPhotos,
    cancelPendingPhotos,
    removePendingPhoto,
    updatePendingPhoto,
  } = usePhotos()

  return (
    <Screen transparent>
      <LiquidPlasmaBackground />
      <ProgressBar step={2} />

      <View style={styles.header}>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>Add at least 1 photo</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, index) => (
          <PhotoSlot
            key={item.id}
            item={item}
            index={index}
            onSlotPress={onSlotPress}
            retryUpload={() => {}}
            removePhoto={removePhoto}
          />
        ))}
      </ScrollView>

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

      <MediaPreviewModal
        media={pendingMedia}
        onSend={confirmPendingPhotos}
        onCancel={cancelPendingPhotos}
        onRemove={removePendingPhoto}
        onUpdate={updatePendingPhoto}
        actionLabel="Add"
        titleLabel="Ready to add?"
      />
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

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
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
