import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Image, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera, X, Plus, AlertCircle } from 'lucide-react-native'
import { BackButton, ProgressBar, PrimaryButton, Screen, ToastBanner } from '@/components/ui'
import type { ToastType } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { uploadPhoto, swapPhotos } from '@/api/user'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

type SlotState = 'idle' | 'uploading' | 'done' | 'error'

const SLOTS = 5

export default function PhotosScreen() {
  const store = useOnboardingStore()

  const [localUris, setLocalUris] = useState<(string | null)[]>(Array(SLOTS).fill(null))
  const [slotStates, setSlotStates] = useState<SlotState[]>(Array(SLOTS).fill('idle'))
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [nextLoading, setNextLoading] = useState(false)

  // toast: key changes force re-mount so animation restarts each time
  const toastKeyRef = useRef(0)
  const [toast, setToast] = useState<{ key: number; message: string; type: ToastType } | null>(null)

  // refs so background callbacks don't close over stale state
  const serverUrls = useRef<(string | null)[]>(Array(SLOTS).fill(null))
  const uploadGens = useRef<number[]>(Array(SLOTS).fill(0))
  const uploadPromises = useRef<Map<number, Promise<void>>>(new Map())

  const hasAnyPhoto = localUris.some(Boolean)
  const anyUploading = slotStates.some(s => s === 'uploading')

  // ── helpers ──────────────────────────────────────────────────────────────────

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ key: ++toastKeyRef.current, message, type })
  }

  const setSlotState = (index: number, state: SlotState) =>
    setSlotStates(prev => { const n = [...prev]; n[index] = state; return n })

  const startUpload = (uri: string, index: number) => {
    const gen = ++uploadGens.current[index]
    const promise = uploadPhoto(uri, index)
      .then(url => {
        if (uploadGens.current[index] !== gen) return
        serverUrls.current[index] = url
        setSlotState(index, 'done')
      })
      .catch((err: any) => {
        if (uploadGens.current[index] !== gen) return
        console.error(`[Photos] slot ${index}:`, err?.message)
        setSlotState(index, 'error')
        showToast(err?.message ?? 'Upload failed. Tap to retry.', 'error')
      })
    uploadPromises.current.set(index, promise)
  }

  // ── actions ───────────────────────────────────────────────────────────────────

  const pickPhoto = async (index: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showToast('Allow photo access to add photos', 'error')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri

    // Duplicate check
    if (localUris.includes(uri)) {
      showToast('You already added this photo', 'error')
      return
    }

    serverUrls.current[index] = null
    setLocalUris(prev => { const n = [...prev]; n[index] = uri; return n })
    setSlotState(index, 'uploading')
    startUpload(uri, index)
  }

  const retryUpload = (index: number) => {
    const uri = localUris[index]
    if (!uri) return
    serverUrls.current[index] = null
    setSlotState(index, 'uploading')
    startUpload(uri, index)
  }

  const removePhoto = (index: number) => {
    uploadGens.current[index]++
    uploadPromises.current.delete(index)
    serverUrls.current[index] = null
    if (selectedSlot === index) setSelectedSlot(null)
    setLocalUris(prev => { const n = [...prev]; n[index] = null; return n })
    setSlotState(index, 'idle')
  }

  const swapSlots = (a: number, b: number) => {
    const uriA = localUris[a]
    const uriB = localUris[b]

    // Swap client URIs
    setLocalUris(prev => {
      const n = [...prev]
      ;[n[a], n[b]] = [n[b], n[a]]
      return n
    })

    // Set both to uploading to re-sync positions with server
    setSlotStates(prev => {
      const n = [...prev]
      n[a] = uriB ? 'uploading' : 'idle'
      n[b] = uriA ? 'uploading' : 'idle'
      return n
    })

    serverUrls.current[a] = null
    serverUrls.current[b] = null

    uploadGens.current[a]++
    uploadGens.current[b]++

    if (uriB) startUpload(uriB, a)
    if (uriA) startUpload(uriA, b)

    showToast('Reordered!', 'success')
  }

  // ── slot press handlers ───────────────────────────────────────────────────────

  const onSlotPress = (index: number) => {
    // ── reorder mode ──
    if (selectedSlot !== null) {
      if (index === selectedSlot) {
        setSelectedSlot(null)
        return
      }
      if (!localUris[index]) {
        showToast('Tap a slot with a photo to swap', 'info')
        return
      }
      swapSlots(selectedSlot, index)
      setSelectedSlot(null)
      return
    }

    // ── normal mode ──
    if (!localUris[index]) {
      pickPhoto(index)
    } else if (slotStates[index] === 'error') {
      retryUpload(index)
    }
  }

  const onSlotLongPress = (index: number) => {
    if (!localUris[index]) return
    if (anyUploading) {
      showToast('Wait for uploads to finish first', 'info')
      return
    }
    setSelectedSlot(index)
    showToast('Tap another slot to swap positions', 'info')
  }

  // ── next ─────────────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!hasAnyPhoto) return
    setNextLoading(true)
    try {
      await Promise.all([...uploadPromises.current.values()])

      const hasFailed = localUris.some((uri, i) => uri && !serverUrls.current[i])
      if (hasFailed) {
        showToast('Some photos failed — tap the red slots to retry', 'error')
        return
      }

      store.setField('photoUris', serverUrls.current.filter(Boolean) as string[])
      router.push('/(onboarding)/voice')
    } finally {
      setNextLoading(false)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────────

  const renderSlot = (index: number, isMain: boolean) => {
    const uri = localUris[index]
    const state = slotStates[index]
    const isSelected = selectedSlot === index
    const isSwapTarget = selectedSlot !== null && selectedSlot !== index && !!uri

    return (
      <Pressable
        key={index}
        onPress={() => onSlotPress(index)}
        onLongPress={() => onSlotLongPress(index)}
        delayLongPress={320}
        style={[
          isMain ? styles.mainSlot : styles.smallSlot,
          isSelected && styles.slotSelected,
          isSwapTarget && styles.slotSwapTarget,
        ]}
      >
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={[StyleSheet.absoluteFill, isSelected && { opacity: 0.75 }]}
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

            {isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeTxt}>Moving…</Text>
              </View>
            )}

            {(state === 'done' || state === 'uploading') && !isSelected && (
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
        <Text style={styles.subtitle}>
          {selectedSlot !== null
            ? 'Tap another slot to swap positions'
            : 'Add at least 1 · Long press to reorder'}
        </Text>
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

      {/* Toast — key forces re-mount so animation restarts on each new toast */}
      {toast && (
        <ToastBanner key={toast.key} message={toast.message} type={toast.type} />
      )}
    </Screen>
  )
}

const BORDER_RADIUS = Radius.card

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
    borderRadius: BORDER_RADIUS,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSelected: {
    borderWidth: 2.5,
    borderColor: Colors.brandOrange,
  },
  slotSwapTarget: {
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.45)',
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
  selectedBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: Colors.brandOrange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  selectedBadgeTxt: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FontFamily.bodySemiBold,
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
