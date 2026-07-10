import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Dimensions } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Colors, FontFamily } from '@/constants'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { useEventPhotos } from '@/hooks/useEventPhotos'
import { ef } from './styles'
import { usePillStore } from '@/store/pillStore'
import { MediaPreviewModal } from '@/components/chat/MediaPreviewModal'
import type { PendingMedia } from '@/hooks/useMediaPicker'

const SW = Dimensions.get('window').width

interface Props {
  form: CreateEventForm
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  disabled?: boolean
  inline?: boolean
}

export function Step5Photos({ form, set, errors, setErrors, disabled, inline }: Props) {
  const { slotStates, addPhoto, removePhoto, displayUri } = useEventPhotos(form.coverPhotos, set)
  const showPill = usePillStore(s => s.show)

  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([])
  const [pendingPosition, setPendingPosition] = useState<number>(0)

  const pickForSlot = async (position: number) => {
    if (disabled) return

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showPill('Allow photo access to add cover photos', 'error')
      return
    }

    const isReplacing = !!displayUri(position)
    let selectionLimit = 1
    if (position > 0 && !isReplacing) {
      let emptyCount = 0
      for (let i = position; i <= 4; i++) {
        if (!displayUri(i)) emptyCount++
      }
      selectionLimit = Math.max(1, emptyCount)
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1, // Get full quality, we will compress after crop
      allowsEditing: false, // We use our own cropper
      allowsMultipleSelection: selectionLimit > 1,
      selectionLimit,
    })

    if (!result.canceled && result.assets.length > 0) {
      setErrors(e => ({ ...e, coverPhotos: '' }))
      setPendingMedia(result.assets.map(a => ({
        uri: a.uri,
        type: 'image',
        width: a.width,
        height: a.height,
      })))
      setPendingPosition(position)
    }
  }

  const handleSend = async () => {
    if (pendingMedia.length > 0) {
      const mediaToUpload = [...pendingMedia]
      const startPosition = pendingPosition
      setPendingMedia([]) // close modal first

      let currentPos = startPosition
      for (const media of mediaToUpload) {
        // Find next empty slot if not replacing the exact slot
        while (currentPos > 0 && currentPos <= 4 && displayUri(currentPos) && currentPos !== startPosition) {
          currentPos++
        }
        if (currentPos > 4) break

        addPhoto(currentPos, media.uri)
        currentPos++
      }
    }
  }

  const isCoverUploading = slotStates[0] === 'uploading'
  const coverUri = displayUri(0)
  
  const sidePadding = inline ? 0 : 24
  const availableWidth = SW - (inline ? 40 : 48)
  const coverHeight = availableWidth * (9 / 16)
  const smallSlotSize = (availableWidth - 12) / 2

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        {!inline && (
          <View style={s.header}>
            <Text style={ef.stepTitle}>Photos</Text>
            <Text style={ef.stepSub}>Make it look good</Text>
          </View>
        )}

        <View style={{ paddingHorizontal: sidePadding }}>
          <Text style={[ef.fieldLabel, { marginTop: inline ? 0 : 24 }]}>Cover Photo (16:9)</Text>
        
        <Pressable 
          style={[s.coverSlot, { width: availableWidth, height: coverHeight }]} 
          onPress={() => !isCoverUploading && pickForSlot(0)}
        >
          {coverUri ? (
            <>
              <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {isCoverUploading && (
                <View style={s.uploadOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
              {!disabled && !isCoverUploading && (
                <Pressable style={s.removeBtnTopRight} onPress={() => removePhoto(0)} hitSlop={12}>
                  <X size={16} color="#fff" strokeWidth={3} />
                </Pressable>
              )}
            </>
          ) : slotStates[0] === 'uploading' ? (
            <View style={s.uploadOverlay}>
              <ActivityIndicator size="large" color={Colors.brandOrange} />
            </View>
          ) : (
            <View style={s.placeholderContainer}>
              <Plus size={24} color={Colors.glassTextDisabled} />
              <Text style={s.placeholderText}>Cover Photo (16:9)</Text>
            </View>
          )}
        </Pressable>

        <Text style={[ef.fieldLabel, { marginTop: 32 }]}>Gallery (Optional)</Text>
        <View style={[s.galleryGrid, { width: availableWidth }]}>
          {[1, 2, 3, 4].map((i) => {
            const uri = displayUri(i)
            const uploading = slotStates[i] === 'uploading'
            return (
              <Pressable
                key={i}
                style={[s.smallSlot, { width: smallSlotSize, height: smallSlotSize }]}
                onPress={() => !uploading && pickForSlot(i)}
              >
                {uri ? (
                  <>
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    {uploading && (
                      <View style={s.uploadOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                    {!disabled && !uploading && (
                      <Pressable style={s.removeBtnSmall} onPress={() => removePhoto(i)} hitSlop={8}>
                        <X size={12} color="#fff" strokeWidth={3} />
                      </Pressable>
                    )}
                  </>
                ) : uploading ? (
                  <View style={s.uploadOverlay}>
                    <ActivityIndicator size="small" color={Colors.brandOrange} />
                  </View>
                ) : (
                  <Plus size={20} color={Colors.glassTextDisabled} />
                )}
              </Pressable>
            )
          })}
        </View>
        {errors.coverPhotos ? <Text style={[ef.errorText, { marginTop: 12 }]}>{errors.coverPhotos}</Text> : null}
        </View>
      </ScrollView>

      {pendingMedia.length > 0 && (
        <MediaPreviewModal
          media={pendingMedia}
          cropAspectRatio={pendingPosition === 0 ? 16 / 9 : 1}
          onCancel={() => setPendingMedia([])}
          onRemove={() => setPendingMedia([])}
          onUpdate={(index, updated) => setPendingMedia([updated])}
          onSend={handleSend}
          actionLabel="Add Photo"
          titleLabel={pendingPosition === 0 ? "Cover Photo" : "Gallery Photo"}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { padding: 24, paddingBottom: 0 },
  coverSlot: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.glassTextDisabled,
  },
  galleryGrid: {
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  smallSlot: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
