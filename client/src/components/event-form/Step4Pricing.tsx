import React, { useEffect } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { Image } from 'expo-image'
import { Colors } from '@/constants'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { useEventPhotos } from '@/hooks/useEventPhotos'
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
  /** Monthly free event slot info */
  freeUsed?: number
  resetsOn?: string
}

function PhotoSlotView({
  uri, uploading, onPress, onRemove, disabled, size,
}: {
  uri: string | null
  uploading: boolean
  onPress: () => void
  onRemove: () => void
  disabled?: boolean
  size: 'cover' | 'small'
}) {
  const isCover = size === 'cover'
  const slotStyle = isCover ? ef.photoCoverSlot : ef.photoSmallSlot
  const filled = !!uri

  return (
    <Pressable
      style={[slotStyle, filled && ef.photoSlotFilled]}
      onPress={!disabled && !uploading ? onPress : undefined}
    >
      {uri ? (
        <>
          <Image
            source={{ uri }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
          {uploading && (
            <View style={s.uploadOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
          {!disabled && !uploading && (
            <Pressable style={ef.photoRemove} onPress={onRemove} hitSlop={8}>
              <X size={isCover ? 12 : 10} color="#fff" />
            </Pressable>
          )}
        </>
      ) : uploading ? (
        <View style={s.uploadOverlay}>
          <ActivityIndicator size="small" color={Colors.brandOrange} />
        </View>
      ) : isCover ? (
        <View style={ef.photoPlaceholder}>
          <Plus size={24} color={Colors.inkDisabled} />
          <Text style={ef.photoPlaceholderText}>Cover</Text>
        </View>
      ) : (
        <Plus size={18} color={Colors.inkDisabled} />
      )}
    </Pressable>
  )
}

function Inner({ form, set, errors, setErrors, submitError, priceLocked, priceLockNote, disabled, freeUsed = 0, resetsOn = '' }: Omit<Props, 'scrollable'>) {
  const { slotStates, pickPhoto, removePhoto, displayUri } = useEventPhotos(form.coverPhotos, set)
  const effectivelyLocked = disabled || priceLocked
  const slotsExhausted = freeUsed >= 2

  // Auto-switch to Paid if free slots are exhausted
  useEffect(() => {
    if (slotsExhausted && form.isFree) {
      set('isFree', false)
    }
  }, [slotsExhausted])

  // Format resets_on as "Jul 1"
  const resetsOnFormatted = resetsOn
    ? new Date(resetsOn).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : ''

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
            style={[ef.pricingBtn, form.isFree && ef.pricingBtnActive, slotsExhausted && s.freeDisabled]}
            onPress={() => { if (!effectivelyLocked && !slotsExhausted) { set('isFree', true); set('priceInr', 0) } }}
          >
            <Text style={[ef.pricingBtnText, form.isFree && ef.pricingBtnTextActive, slotsExhausted && s.freeDisabledText]}>Free</Text>
          </Pressable>
          <Pressable
            style={[ef.pricingBtn, !form.isFree && ef.pricingBtnActive]}
            onPress={() => { if (!effectivelyLocked) set('isFree', false) }}
          >
            <Text style={[ef.pricingBtnText, !form.isFree && ef.pricingBtnTextActive]}>Paid</Text>
          </Pressable>
        </View>

        {/* Free slot usage note */}
        {slotsExhausted ? (
          <View style={s.slotNote}>
            <Text style={s.slotNoteText}>
              You've used 2/2 free events this month.{resetsOnFormatted ? ` Free events reset on ${resetsOnFormatted}.` : ''}
            </Text>
          </View>
        ) : freeUsed === 1 ? (
          <View style={s.slotNoteSubtle}>
            <Text style={s.slotNoteSubtleText}>1 of 2 free events used this month</Text>
          </View>
        ) : null}

        {!form.isFree && (
          <View style={[ef.inputWrap, { marginTop: 12 }, errors.priceInr && ef.inputWrapError]}>
            <Text style={ef.currencySymbol}>₹</Text>
            <TextInput
              style={[ef.textInput, { flex: 1 }]}
              value={form.priceInr > 0 ? String(form.priceInr) : ''}
              onChangeText={v => { const n = parseInt(v, 10); set('priceInr', isNaN(n) ? 0 : n); setErrors(e => ({ ...e, priceInr: '' })) }}
              placeholder={slotsExhausted ? 'Minimum ₹299' : 'Ticket price'}
              placeholderTextColor={Colors.inkDisabled}
              keyboardType="numeric"
              editable={!effectivelyLocked}
            />
          </View>
        )}
        {errors.priceInr ? <Text style={ef.errorText}>{errors.priceInr}</Text> : null}
      </View>

      {/* Photos grid */}
      <Text style={[ef.fieldLabel, { marginTop: 24 }]}>Event Photos (up to 5)</Text>
      <View style={ef.photosGrid}>
        <PhotoSlotView
          uri={displayUri(0)}
          uploading={slotStates[0] === 'uploading'}
          onPress={() => pickPhoto(0)}
          onRemove={() => removePhoto(0)}
          disabled={disabled}
          size="cover"
        />
        <View style={ef.photoSmallGrid}>
          {[1, 2, 3, 4].map(i => (
            <PhotoSlotView
              key={i}
              uri={displayUri(i)}
              uploading={slotStates[i] === 'uploading'}
              onPress={() => pickPhoto(i)}
              onRemove={() => removePhoto(i)}
              disabled={disabled}
              size="small"
            />
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
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitError: {
    backgroundColor: 'rgba(255,56,100,0.15)',
    borderRadius: 10, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: Colors.brandCoral,
  },
  submitErrorText: { color: Colors.brandCoral, fontFamily: 'Satoshi-Medium', fontSize: 13 },
  freeDisabled: { opacity: 0.35 },
  freeDisabledText: { color: 'rgba(255,255,255,0.4)' },
  slotNote: {
    marginTop: 10,
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotNoteText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: Colors.brandOrange,
    lineHeight: 17,
  },
  slotNoteSubtle: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  slotNoteSubtleText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
})
