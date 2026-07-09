import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { AppHeader, BackButton, Screen, PhotoSlot, PrimaryButton } from '@/components/ui'
import { MediaPreviewModal } from '@/components/chat/MediaPreviewModal'
import { useEditPhotos } from '@/hooks/useEditPhotos'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function EditPhotosScreen() {
  const {
    loading,
    saving,
    items,
    canSave,
    onSlotPress,
    removePhoto,
    handleSave,
    pendingMedia,
    confirmPendingPhotos,
    cancelPendingPhotos,
    removePendingPhoto,
    updatePendingPhoto,
  } = useEditPhotos()

  if (loading) {
    return (
      <Screen top={false}>
        <AppHeader title="Edit Photos" leftAction={<BackButton onPress={() => router.back()} />} />
        <View style={styles.center}><ActivityIndicator color={Colors.brandOrange} /></View>
      </Screen>
    )
  }

  return (
    <Screen top={false}>
      <AppHeader title="Edit Photos" leftAction={<BackButton onPress={() => router.back()} />} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.hintText}>
          Your first photo is your main profile picture. You can add up to 6 photos. Tap a photo to remove it.
        </Text>

        <View style={styles.grid}>
          {items.map((item, idx) => (
            <PhotoSlot
              key={item.id}
              item={item}
              index={idx}
              onSlotPress={onSlotPress}
              retryUpload={() => { }}
              removePhoto={removePhoto}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Save Changes"
          onPress={handleSave}
          disabled={!canSave}
          loading={saving}
        />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
    paddingTop: 12,
  },
  hintText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 12,
    paddingBottom: Spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
})
