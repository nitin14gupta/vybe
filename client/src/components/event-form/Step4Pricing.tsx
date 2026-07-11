import React, { useEffect } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { Image } from 'expo-image'
import { Colors, PLATFORM_FEE_RATE, PLATFORM_FEE_PERCENT_LABEL } from '@/constants'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { useEventPhotos } from '@/hooks/useEventPhotos'
import { ef } from './styles'
import { usePillStore } from '@/store/pillStore'

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


function Inner({ form, set, errors, setErrors, submitError, priceLocked, priceLockNote, disabled, freeUsed = 0, resetsOn = '' }: Omit<Props, 'scrollable'>) {
  const showPill = usePillStore.getState().show
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
            onPress={() => {
              if (slotsExhausted) {
                const msg = resetsOnFormatted
                  ? `Free events reset on ${resetsOnFormatted}`
                  : "You've used your 2 free events this month"
                showPill(msg, 'error')
                return
              }
              if (!effectivelyLocked) { set('isFree', true); set('priceInr', 0) }
            }}
          >
            <Text style={[ef.pricingBtnText, form.isFree && ef.pricingBtnTextActive]}>Free</Text>
          </Pressable>
          <Pressable
            style={[ef.pricingBtn, !form.isFree && ef.pricingBtnActive]}
            onPress={() => { if (!effectivelyLocked) set('isFree', false) }}
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
              placeholderTextColor={Colors.glassTextDisabled}
              keyboardType="numeric"
              editable={!effectivelyLocked}
            />
          </View>
        )}
        {errors.priceInr ? <Text style={ef.errorText}>{errors.priceInr}</Text> : null}

        {!form.isFree && form.priceInr > 0 ? (
          <View style={s.feeBreakdown}>
            <Text style={s.feeBreakdownText}>
              Attendees pay ₹{form.priceInr + Math.round(form.priceInr * PLATFORM_FEE_RATE)} total
              (₹{form.priceInr} ticket + {PLATFORM_FEE_PERCENT_LABEL} platform fee). You always receive
              the full ₹{form.priceInr} you set here.
            </Text>
          </View>
        ) : null}
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
      <Text style={ef.stepTitle}>Pricing</Text>
      <Text style={ef.stepSub}>Set a ticket price or keep it free</Text>
      <Inner {...props} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  lockedSection: { opacity: 0.45 },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
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
  feeBreakdown: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
  },
  feeBreakdownText: {
    color: Colors.glassTextSecondary,
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 17,
  },
})
