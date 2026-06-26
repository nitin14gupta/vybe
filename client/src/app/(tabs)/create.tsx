import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { hTap, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import { DateTimePickerSheet, Screen } from '@/components/ui'
import { Step1Basics, Step2When, Step3Where, Step4Pricing } from '@/components/event-form'
import { useCreateEvent } from '@/hooks/useCreateEvent'
import { useEventDateTimePickers } from '@/hooks/useEventDateTimePickers'
import { usePillStore } from '@/store/pillStore'

// ── Step button ───────────────────────────────────────────────────────────────

function StepButton({ step, loading, onPress }: { step: number; loading: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => { step === 4 ? hSuccess() : hTap(); onPress() }} style={s.nextBtn} disabled={loading}>
      <LinearGradient
        colors={['#FF6B35', '#FF3864']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.nextGradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.nextText}>
            {step === 4 ? 'Publish Event 🔥' : 'Next Step →'}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <View style={s.stepBar}>
      {[1, 2, 3, 4].map(n => (
        <View key={n} style={[s.stepSegment, n <= step && s.stepSegmentActive]} />
      ))}
    </View>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { form, set, reset, submit, submitting, submitError } = useCreateEvent()
  const { openDate, openStartTime, openEndDate, openEndTime, picker } = useEventDateTimePickers(form, set)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nextLoading, setNextLoading] = useState(false)
  const showPill = usePillStore(s => s.show)

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {}
    let firstPill: string | null = null
    const flag = (field: string, inline: string, pill: string) => {
      errs[field] = inline
      if (!firstPill) firstPill = pill
    }

    if (step === 1) {
      if (!form.title.trim()) flag('title', 'Event title is required', 'Please add an event title')
      if (!form.eventType)    flag('eventType', 'Please select an event type', 'Please select an event type')
    }
    if (step === 2) {
      if (!form.dateTime) {
        flag('dateTime', 'Event date is required', 'Please set an event date and time')
      } else if (form.dateTime < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        flag('dateTime', 'Events must be posted at least 24 hours in advance', 'Events must be posted at least 24 hours in advance')
      }
      if (form.endTime && form.dateTime && form.endTime <= form.dateTime) {
        flag('endTime', 'End time must be after start time', 'End time must be after the start time')
      }
      if (form.capacity < 5)   flag('capacity', 'Minimum 5 guests required', 'Capacity must be between 5 and 200')
      if (form.capacity > 200) flag('capacity', 'Maximum 200 guests allowed', 'Capacity must be between 5 and 200')
    }
    if (step === 3) {
      if (!form.locationName.trim()) flag('locationName', 'Location is required', 'Please add a venue or address')
    }
    if (step === 4) {
      if (!form.isFree && form.priceInr < 50) flag('priceInr', 'Minimum ticket price is ₹50', 'Minimum ticket price is ₹50')
    }

    setErrors(errs)
    if (firstPill) showPill(firstPill, 'error')
    return Object.keys(errs).length === 0
  }

  const next = async () => {
    if (!validateStep()) return
    setNextLoading(true)
    try {
      if (step === 2 && form.locationLat == null) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status === 'granted') {
            const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            set('locationLat', coords.latitude)
            set('locationLng', coords.longitude)
          }
        } catch {}
      }
      if (step < 4) setStep((step + 1) as 1 | 2 | 3 | 4)
    } finally {
      setNextLoading(false)
    }
  }

  const back = () => { if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4) }

  const publish = async () => {
    if (!validateStep()) return
    const result = await submit()
    if (result) {
      reset()
      setStep(1)
      router.replace(`/(events)/published?id=${result.id}&title=${encodeURIComponent(result.title)}` as any)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Pressable style={s.headerClose} onPress={() => { step > 1 ? back() : router.back() }}>
            {step > 1 ? (
              <Text style={s.headerBackText}>← Back</Text>
            ) : (
              <X size={22} color={Colors.inkPrimary} />
            )}
          </Pressable>
          <Text style={s.headerTitle}>Create Event</Text>
          <Text style={s.headerStep}>Step {step}/4</Text>
        </View>

        <StepBar step={step} />

        {step === 1 && (
          <Step1Basics form={form} set={set} errors={errors} setErrors={setErrors} />
        )}
        {step === 2 && (
          <Step2When
            form={form} set={set} errors={errors} setErrors={setErrors}
            openDate={openDate} openStartTime={openStartTime} openEndDate={openEndDate} openEndTime={openEndTime}
          />
        )}
        {step === 3 && (
          <Step3Where form={form} set={set} errors={errors} setErrors={setErrors} />
        )}
        {step === 4 && (
          <Step4Pricing
            form={form} set={set} errors={errors} setErrors={setErrors}
            submitError={submitError}
          />
        )}

        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <StepButton
            step={step}
            loading={step === 4 ? submitting : nextLoading}
            onPress={step === 4 ? publish : next}
          />
        </View>

        <DateTimePickerSheet
          visible={picker.visible}
          mode={picker.mode}
          value={picker.value}
          onConfirm={picker.confirm}
          onDismiss={picker.dismiss}
        />
      </KeyboardAvoidingView>
    </Screen>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  headerClose: { width: 70, justifyContent: 'flex-start' },
  headerBackText: { color: Colors.brandOrange, fontFamily: FontFamily.bodyMedium, fontSize: 14 },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  headerStep: { width: 70, textAlign: 'right', fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  stepBar: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 4,
    paddingVertical: 8, backgroundColor: Colors.background,
  },
  stepSegment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.elevated },
  stepSegmentActive: { backgroundColor: Colors.brandOrange },
  bottomBar: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  nextBtn: { borderRadius: 16, overflow: 'hidden' },
  nextGradient: { paddingVertical: 16, alignItems: 'center' },
  nextText: { color: '#fff', fontFamily: FontFamily.bodySemiBold, fontSize: 16 },
})
