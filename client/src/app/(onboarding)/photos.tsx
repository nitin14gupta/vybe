import { View, Text, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Camera, X, Plus, AlertCircle } from 'lucide-react-native'
import { BackButton, ProgressBar, PrimaryButton, Screen, ToastBanner } from '@/components/ui'
import { usePhotos } from '@/hooks/usePhotos'
import type { SlotState } from '@/hooks/usePhotos'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export default function PhotosScreen() {
  const {
    localUris,
    slotStates,
    nextLoading,
    hasAnyPhoto,
    toast,
    onSlotPress,
    retryUpload,
    removePhoto,
    handleNext,
  } = usePhotos()

  const renderSlot = (index: number, isMain: boolean) => {
    const uri = localUris[index]
    const state: SlotState = slotStates[index]

    return (
      <Pressable
        key={index}
        onPress={() => onSlotPress(index)}
        style={isMain ? styles.mainSlot : styles.smallSlot}
      >
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />

            {state === 'uploading' && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}

            {state === 'error' && (
              <Pressable onPress={() => retryUpload(index)} style={styles.errorOverlay}>
                <AlertCircle size={18} color="#fff" />
                <Text style={styles.retryTxt}>Tap to retry</Text>
              </Pressable>
            )}

            {(state === 'done' || state === 'uploading') && (
              <Pressable
                onPress={() => removePhoto(index)}
                style={styles.removeBtn}
                hitSlop={10}
              >
                <X size={11} color="#fff" strokeWidth={3} />
              </Pressable>
            )}
          </>
        ) : isMain ? (
          <View style={styles.mainEmpty}>
            <View style={styles.cameraCircle}>
              <Camera size={22} color={Colors.inkPrimary} strokeWidth={2} />
            </View>
            <Text style={styles.addLabel}>Add photo</Text>
          </View>
        ) : (
          <Plus size={24} color={Colors.brandOrange} strokeWidth={1.5} />
        )}
      </Pressable>
    )
  }

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <ProgressBar step={2} />

      <View style={styles.header}>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>Add at least 1 photo to continue</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {renderSlot(0, true)}
        <View style={styles.row}>
          {renderSlot(1, false)}
          {renderSlot(2, false)}
        </View>
        <View style={styles.row}>
          {renderSlot(3, false)}
          {renderSlot(4, false)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Next →"
          onPress={handleNext}
          disabled={!hasAnyPhoto}
          loading={nextLoading}
        />
      </View>

      {toast && (
        <ToastBanner key={toast.key} message={toast.message} type={toast.type} />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
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
  scroll: { flex: 1 },
  grid: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 12,
    gap: 10,
  },
  row: { flexDirection: 'row', gap: 10 },

  mainSlot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.card,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.card,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainEmpty: { alignItems: 'center', gap: 12 },
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

  footer: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
})
