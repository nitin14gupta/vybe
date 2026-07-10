import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { ChevronLeft, X } from 'lucide-react-native'
import { hTap, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import {
  DateTimePickerSheet,
  KeyboardAvoidingWrapper,
  PrimaryButton,
  Screen,
} from '@/components/ui'
import { Step1Basics, Step2When, Step3Where, Step4Pricing, Step5Photos } from '@/components/event-form'
import { useCreateEvent } from '@/hooks/useCreateEvent'
import ApiService from '@/api/apiService'
import { useEventDateTimePickers } from '@/hooks/useEventDateTimePickers'
import { usePillStore } from '@/store/pillStore'
import LiquidPlasmaBackground from '@/components/LiquidPlasmaBackground'

const STEPS_COLORS: [string, string][] = [
  ['#111111', '#FF3864'], // 1: Coral
  ['#0a0f25', '#1a5bdf'], // 2: Blue
  ['#1a0525', '#b73c10ff'], // 3: Purple
  ['#1a2a1f', '#00b86b'], // 4: Green
  ['#1a1605', '#d41b81'], // 5: Deep Gold & Magenta
]

const STEPS = [
  { title: 'The Basics', sub: 'Tell people what your event is about' },
  { title: 'When & Capacity', sub: 'Set the date, time, and guest limit' },
  { title: "Where's the VYBE?", sub: 'Help guests find your event' },
  { title: 'Pricing', sub: 'Set a ticket price or keep it free' },
  { title: 'Photos', sub: 'Make it look good' },
]

export default function CreateScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { form, set, reset, submit, submitting, submitError } = useCreateEvent()
  const { openDate, openStartTime, openEndDate, openEndTime, picker } = useEventDateTimePickers(form, set)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nextLoading, setNextLoading] = useState(false)
  const showPill = usePillStore(s => s.show)
  const [freeSlots, setFreeSlots] = useState<{ used: number; limit: number; resets_on: string } | null>(null)

  useEffect(() => {
    ApiService.getFreeSlots().then(setFreeSlots).catch(() => { })
  }, [])

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {}
    let firstPill: string | null = null
    const flag = (field: string, inline: string, pill: string) => {
      errs[field] = inline
      if (!firstPill) firstPill = pill
    }
    if (step === 1) {
      if (!form.title.trim()) flag('title', 'Event title is required', 'Please add an event title')
      if (!form.eventType) flag('eventType', 'Please select an event type', 'Please select an event type')
    }
    if (step === 2) {
      if (!form.dateTime) {
        flag('dateTime', 'Event date is required', 'Please set an event date and time')
      } else if (form.dateTime < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        flag('dateTime', 'Events must be posted at least 24 hours in advance', 'Events must be posted at least 24 hours in advance')
      }
      if (!form.endTime) {
        flag('endTime', 'End date & time is required', 'Please set an end date and time for your event')
      } else if (form.dateTime) {
        const durMs = form.endTime.getTime() - form.dateTime.getTime()
        if (durMs <= 0) {
          flag('endTime', 'End time must be after start time', 'End time must be after the start time')
        } else if (durMs < 60 * 60 * 1000) {
          flag('endTime', 'Event must be at least 1 hour long', 'Event must be at least 1 hour long')
        } else if (durMs > 72 * 60 * 60 * 1000) {
          flag('endTime', "Events can't run longer than 3 days", "Events can't run longer than 3 days. Contact support for exceptions.")
        }
      }
      if (form.capacity < 5) flag('capacity', 'Minimum 5 guests required', 'Capacity must be between 5 and 200')
      if (form.capacity > 200) flag('capacity', 'Maximum 200 guests allowed', 'Capacity must be between 5 and 200')
    }
    if (step === 3) {
      if (!form.locationName.trim()) flag('locationName', 'Location is required', 'Please add a venue or address')
    }
    if (step === 4) {
      const slotsExhausted = (freeSlots?.used ?? 0) >= 2
      const minPrice = slotsExhausted ? 299 : 50
      if (form.isFree && slotsExhausted) {
        flag('priceInr', "You've used 2 free events this month", "You've used your 2 free events this month. Set a ticket price.")
      } else if (!form.isFree && form.priceInr < minPrice) {
        flag('priceInr', `Minimum ticket price is ₹${minPrice}`, `Minimum ticket price is ₹${minPrice}`)
      }
    } else if (step === 5) {
      if (!form.coverPhotos[0]) {
        flag('coverPhotos', 'Cover photo is required', 'Please add a 16:9 cover photo for your event')
      }
      const hasGallery = form.coverPhotos.slice(1).some(uri => !!uri)
      if (!hasGallery) {
        flag('coverPhotos', 'At least one gallery photo is required', 'Please add at least one 1:1 gallery photo')
      }
    }
    setErrors(errs)
    if (firstPill) showPill(firstPill, 'error')
    return Object.keys(errs).length === 0
  }

  const handleNext = async () => {
    if (!validateStep()) return
    if (step < 5) {
      if (step === 2 && form.locationLat == null) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status === 'granted') {
            const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            set('locationLat', coords.latitude)
            set('locationLng', coords.longitude)
          }
        } catch { }
      }
      setStep(s => (s + 1) as any)
      return
    }
    setNextLoading(true)
    const result = await submit()
    if (result) {
      hSuccess()
      reset()
      setStep(1)
      router.replace(`/(events)/published?id=${result.id}&title=${encodeURIComponent(result.title)}` as any)
    }
    setNextLoading(false)
  }

  const back = () => { if (step > 1) setStep((step - 1) as any) }

  return (
    <Screen bottom={false} transparent>
      <LiquidPlasmaBackground colors={STEPS_COLORS[step - 1]} />
      <View style={s.header}>
        <Pressable
          style={s.iconBtn}
          onPress={() => { hTap(); step > 1 ? back() : router.back() }}
          hitSlop={10}
        >
          {step > 1
            ? <ChevronLeft size={20} color="#fff" strokeWidth={2.2} />
            : <X size={20} color="#fff" strokeWidth={2.2} />}
        </Pressable>

        <Text style={s.headerTitle}>Create Event</Text>

        <View style={s.stepPill}>
          <Text style={s.stepPillNum}>{step}</Text>
          <Text style={s.stepPillOf}>/5</Text>
        </View>
      </View>

      <View style={s.progress}>
        {[1, 2, 3, 4, 5].map(n => (
          <View key={n} style={[s.seg, n <= step && s.segActive]} />
        ))}
      </View>

      {step === 3 ? (
        <View style={{ flex: 1 }}>
          <Step3Where form={form} set={set} errors={errors} setErrors={setErrors} />
          <View style={[s.step3Footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <PrimaryButton
              label={nextLoading ? "Creating..." : "Continue"}
              onPress={handleNext}
              disabled={nextLoading}
              loading={nextLoading}
            />
          </View>
        </View>
      ) : step === 5 ? (
        <View style={{ flex: 1 }}>
          <Step5Photos form={form} set={set} errors={errors} setErrors={setErrors} />
          <View style={[s.step3Footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <PrimaryButton
              label={nextLoading ? "Publishing..." : "Publish Event"}
              onPress={handleNext}
              disabled={nextLoading}
              loading={nextLoading}
            />
          </View>
        </View>
      ) : (
        <KeyboardAvoidingWrapper key={step} transparent>
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>{STEPS[step - 1].title}</Text>
            <Text style={s.stepSub}>{STEPS[step - 1].sub}</Text>

            {step === 1 && (
              <Step1Basics
                form={form} set={set} errors={errors} setErrors={setErrors}
                scrollable={false}
              />
            )}
            {step === 2 && (
              <Step2When
                form={form} set={set} errors={errors} setErrors={setErrors}
                openDate={openDate} openStartTime={openStartTime}
                openEndDate={openEndDate} openEndTime={openEndTime}
                scrollable={false}
              />
            )}
            {step === 4 && (
              <Step4Pricing
                form={form} set={set} errors={errors} setErrors={setErrors}
                submitError={submitError}
                scrollable={false}
                freeUsed={freeSlots?.used ?? 0}
                resetsOn={freeSlots?.resets_on ?? ''}
              />
            )}

            <View style={s.btnWrap}>
              <PrimaryButton
                label={'Continue'}
                onPress={handleNext}
                loading={nextLoading}
              />
            </View>
            <View style={{ height: Math.max(insets.bottom, 24) }} />
          </View>
        </KeyboardAvoidingWrapper>
      )}

      <DateTimePickerSheet
        visible={picker.visible}
        mode={picker.mode}
        value={picker.value}
        onConfirm={picker.confirm}
        onDismiss={picker.dismiss}
      />
    </Screen>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.glassSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: '#fff',
    letterSpacing: -0.2,
  },
  stepPill: {
    width: 38,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 1,
  },
  stepPillNum: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: '#fff',
  },
  stepPillOf: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.glassTextDisabled,
  },
  progress: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 5,
    marginBottom: 4,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.glassSurface,
  },
  segActive: { backgroundColor: '#fff' },
  stepContent: {
    padding: 24,
    paddingTop: 20,
  },
  stepTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  stepSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.glassTextSecondary,
    marginBottom: 28,
  },
  btnWrap: {
    marginTop: 12,
  },
  step3Footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
})
