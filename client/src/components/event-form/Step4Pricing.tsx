import React from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Colors } from '@/constants'
import ApiService from '@/api/apiService'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { ef } from './styles'

interface Props {
  form: CreateEventForm
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  submitError?: string | null
  /** Lock price/free toggle (attendees already booked) */
  priceLocked?: boolean
  priceLockNote?: string
  disabled?: boolean
  scrollable?: boolean
}

function Inner({ form, set, errors, setErrors, submitError, priceLocked, priceLockNote, disabled }: Omit<Props, 'scrollable'>) {
  const pickPhoto = async (position: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add event photos')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (result.canceled) return
    try {
      const url = await ApiService.uploadEventPhoto(result.assets[0].uri)
      const photos = [...form.coverPhotos]
      photos[position] = url
      set('coverPhotos', photos)
    } catch (e: any) {
      Alert.alert('Upload failed', e.message)
    }
  }

  const removePhoto = (position: number) => {
    const photos = [...form.coverPhotos]
    photos.splice(position, 1)
    set('coverPhotos', photos)
  }

  const effectivlyLocked = disabled || priceLocked

  return (
    <>
      {/* Pricing card */}
      <View style={ef.fieldLabelRow}>
        <Text style={ef.fieldLabel}>Pricing</Text>
        {priceLocked && priceLockNote && <Text style={ef.fieldLockNote}>{priceLockNote}</Text>}
      </View>
      <View style={[ef.pricingCard, priceLocked && s.lockedSection]}>
        <View style={ef.pricingToggle}>
          <Pressable
            style={[ef.pricingBtn, form.isFree && ef.pricingBtnActive]}
            onPress={() => { if (!effectivlyLocked) { set('isFree', true); set('priceInr', 0) } }}
          >
            <Text style={[ef.pricingBtnText, form.isFree && ef.pricingBtnTextActive]}>Free</Text>
          </Pressable>
          <Pressable
            style={[ef.pricingBtn, !form.isFree && ef.pricingBtnActive]}
            onPress={() => { if (!effectivlyLocked) set('isFree', false) }}
          >
            <Text style={[ef.pricingBtnText, !form.isFree && ef.pricingBtnTextActive]}>Paid</Text>
          </Pressable>
        </View>
        {!form.isFree && (
          <View style={[ef.inputWrap, { marginTop: 12 }, errors.priceInr && ef.inputWrapError]}>
            <Text style={ef.currencySymbol}>₹</Text>
            <TextInput
              style={[ef.textInput, { flex: 1 }]}
              value={form.priceInr > 0 ? String(form.priceInr) : ''}
              onChangeText={v => { const n = parseInt(v, 10); set('priceInr', isNaN(n) ? 0 : n); setErrors(e => ({ ...e, priceInr: '' })) }}
              placeholder="Ticket price"
              placeholderTextColor={Colors.inkDisabled}
              keyboardType="numeric"
              editable={!effectivlyLocked}
            />
          </View>
        )}
        {errors.priceInr ? <Text style={ef.errorText}>{errors.priceInr}</Text> : null}
      </View>

      {/* Photos grid */}
      <Text style={[ef.fieldLabel, { marginTop: 24 }]}>Event Photos (up to 5)</Text>
      <View style={ef.photosGrid}>
        <Pressable
          style={[ef.photoCoverSlot, form.coverPhotos[0] ? ef.photoSlotFilled : null]}
          onPress={() => !disabled && pickPhoto(0)}
        >
          {form.coverPhotos[0] ? (
            <>
              <View style={StyleSheet.absoluteFillObject}>
                <Image source={{ uri: form.coverPhotos[0] }} contentFit="cover" style={{ flex: 1 }} />
              </View>
              {!disabled && (
                <Pressable style={ef.photoRemove} onPress={() => removePhoto(0)}>
                  <X size={12} color="#fff" />
                </Pressable>
              )}
            </>
          ) : (
            <View style={ef.photoPlaceholder}>
              <Plus size={24} color={Colors.inkDisabled} />
              <Text style={ef.photoPlaceholderText}>Cover</Text>
            </View>
          )}
        </Pressable>

        <View style={ef.photoSmallGrid}>
          {[1, 2, 3, 4].map(i => (
            <Pressable
              key={i}
              style={[ef.photoSmallSlot, form.coverPhotos[i] ? ef.photoSlotFilled : null]}
              onPress={() => !disabled && pickPhoto(i)}
            >
              {form.coverPhotos[i] ? (
                <>
                  <View style={StyleSheet.absoluteFillObject}>
                    <Image source={{ uri: form.coverPhotos[i] }} contentFit="cover" style={{ flex: 1 }} />
                  </View>
                  {!disabled && (
                    <Pressable style={ef.photoRemove} onPress={() => removePhoto(i)}>
                      <X size={10} color="#fff" />
                    </Pressable>
                  )}
                </>
              ) : (
                <Plus size={18} color={Colors.inkDisabled} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {submitError ? (
        <View style={s.submitError}>
          <Text style={s.submitErrorText}>{submitError}</Text>
        </View>
      ) : null}
    </>
  )
}

export function Step4Pricing({ scrollable = true, ...props }: Props) {
  if (!scrollable) {
    return <View><Inner {...props} /></View>
  }
  return (
    <ScrollView style={ef.stepScroll} contentContainerStyle={ef.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={ef.stepTitle}>Pricing &amp; Photos</Text>
      <Text style={ef.stepSub}>Set the entry fee and add some photos</Text>
      <Inner {...props} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  lockedSection: { opacity: 0.45 },
  submitError: {
    backgroundColor: 'rgba(255,56,100,0.15)',
    borderRadius: 10, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: Colors.brandCoral,
  },
  submitErrorText: { color: Colors.brandCoral, fontFamily: 'Satoshi-Medium', fontSize: 13 },
})
