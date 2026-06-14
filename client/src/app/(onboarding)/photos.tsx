import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert } from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera, X } from 'lucide-react-native'
import { BackButton, ProgressBar, PrimaryButton } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { uploadPhoto } from '@/api/user'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

const SLOT_COUNT = 6

export default function PhotosScreen() {
  const store = useOnboardingStore()
  const [uploading, setUploading] = useState<number | null>(null)

  const hasPhoto = store.photoUris.some(Boolean)

  const pickPhoto = async (index: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add photos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: index === 0 ? [16, 9] : [1, 1],
    })
    if (result.canceled || !result.assets[0]) return

    setUploading(index)
    try {
      const url = await uploadPhoto(result.assets[0].uri, index)
      const uris = [...store.photoUris]
      while (uris.length <= index) uris.push('')
      uris[index] = url
      store.setField('photoUris', uris)
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.')
    } finally {
      setUploading(null)
    }
  }

  const removePhoto = (index: number) => {
    const uris = [...store.photoUris]
    uris[index] = ''
    store.setField('photoUris', uris)
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={() => router.back()} />
      <ProgressBar step={2} />
      <View style={styles.header}>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>Add at least 1 photo. First photo is your main photo.</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: SLOT_COUNT }).map((_, i) => {
          const uri = store.photoUris[i]
          const isMain = i === 0
          const isLoading = uploading === i

          return (
            <Pressable
              key={i}
              onPress={() => !uri && !isLoading && pickPhoto(i)}
              style={[styles.slot, isMain ? styles.mainSlot : styles.smallSlot]}
            >
              {uri ? (
                <>
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <Pressable
                    onPress={() => removePhoto(i)}
                    style={styles.removeBtn}
                    hitSlop={4}
                  >
                    <X size={14} color={Colors.inkPrimary} strokeWidth={2.5} />
                  </Pressable>
                </>
              ) : (
                <View style={styles.emptySlot}>
                  <Camera
                    size={isMain ? 32 : 24}
                    color={Colors.inkSecondary}
                    strokeWidth={1.5}
                  />
                  {isMain && (
                    <Text style={styles.addLabel}>
                      {isLoading ? 'Uploading…' : 'Add main photo'}
                    </Text>
                  )}
                  {isLoading && !isMain && (
                    <Text style={styles.uploadingDot}>•••</Text>
                  )}
                </View>
              )}
            </Pressable>
          )
        })}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Next"
          onPress={() => router.push('/(onboarding)/voice')}
          disabled={!hasPhoto}
          loading={uploading !== null}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  scroll: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 12,
  },
  slot: {
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.divider,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSlot: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  smallSlot: {
    width: '47%',
    aspectRatio: 1,
  },
  emptySlot: {
    alignItems: 'center',
    gap: 6,
  },
  addLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  uploadingDot: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: Colors.inkSecondary,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(17,17,17,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
})
