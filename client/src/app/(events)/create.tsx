import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { hTap, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import {
  BrandedLoader,
  DateTimePickerSheet,
  KeyboardAvoidingWrapper,
  PrimaryButton,
  OutlineButton,
  Screen,
} from '@/components/ui'
import { Step1Basics, Step2When, Step3Where, Step4Pricing, Step5Photos, EventPreviewOverlay, CreateEventHeader, validateCreateEventStep } from '@/components/event-form'
import { useCreateEvent } from '@/hooks/useCreateEvent'
import ApiService from '@/api/apiService'
import { useEventDateTimePickers } from '@/hooks/useEventDateTimePickers'
import { usePillStore } from '@/store/pillStore'
import { useProfile } from '@/hooks/useProfile'

const STEPS = [
  { title: 'The Basics', sub: 'Tell people what your event is about' },
  { title: 'When & Capacity', sub: 'Set the date, time, and guest limit' },
  { title: "Where's the Vibe?", sub: 'Help guests find your event' },
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const showPill = usePillStore(s => s.show)
  const [freeSlots, setFreeSlots] = useState<{ used: number; limit: number; resets_on: string } | null>(null)
  const { profile, loading: profileLoading } = useProfile()

  useEffect(() => {
    ApiService.getFreeSlots().then(setFreeSlots).catch(() => { })
  }, [])

  useEffect(() => {
    if (profileLoading || !profile) return
    if (!profile.is_host_onboarding_finished) {
      router.replace('/(host-onboarding)' as any)
    } else if (!profile.host_agreement_accepted_at) {
      router.replace('/(host-onboarding)/agreement' as any)
    }
  }, [profileLoading, profile])

  useEffect(() => {
    if (submitError) showPill(submitError, 'error')
  }, [submitError])

  if (profileLoading || !profile || !profile.is_host_onboarding_finished || !profile.host_agreement_accepted_at) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <BrandedLoader />
      </Screen>
    )
  }

  const validateStep = (): boolean => {
    const { errors: errs, pillMessage } = validateCreateEventStep(step, form, freeSlots?.used ?? 0)
    setErrors(errs)
    if (pillMessage) showPill(pillMessage, 'error')
    return Object.keys(errs).length === 0
  }

  const MIN_FEEDBACK_MS = 320

  const doPublish = async () => {
    setNextLoading(true)
    try {
      const [result] = await Promise.all([
        submit(),
        new Promise(resolve => setTimeout(resolve, MIN_FEEDBACK_MS)),
      ])
      if (result) {
        hSuccess()
        reset()
        setStep(1)
        router.replace(`/(events)/published?id=${result.id}&title=${encodeURIComponent(result.title)}` as any)
      }
    } finally {
      setNextLoading(false)
    }
  }

  const handleNext = async () => {
    if (!validateStep()) return
    if (step < 5) {
      setNextLoading(true)
      // Location for step 3's map pin is fetched by LocationPickerMap itself
      // once it mounts — doing it here too used to double up the GPS fetch
      // (permission + fix + reverse-geocode, twice) and blocked this step
      // transition on a slow/cold GPS fix. Just advance immediately.
      await new Promise(resolve => setTimeout(resolve, MIN_FEEDBACK_MS))
      setStep(s => (s + 1) as any)
      setNextLoading(false)
      return
    }
    doPublish()
  }

  const back = () => { if (step > 1) setStep((step - 1) as any) }

  return (
    <Screen bottom={false}>
      <CreateEventHeader
        step={step}
        totalSteps={5}
        onBack={() => { step > 1 ? back() : router.back() }}
      />

      {nextLoading && (
        <View style={s.loadingOverlay}>
          <BrandedLoader />
        </View>
      )}

      {step === 3 ? (
        <View style={{ flex: 1 }}>
          <Step3Where form={form} set={set} errors={errors} setErrors={setErrors} />
          <View style={[s.step3Footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <PrimaryButton
              label="Continue"
              onPress={handleNext}
              disabled={nextLoading}
              loading={nextLoading}
            />
          </View>
        </View>
      ) : step === 5 ? (
        <View style={{ flex: 1 }}>
          <Step5Photos form={form} set={set} errors={errors} setErrors={setErrors} />
          <View style={[s.step3Footer, s.step5Footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <OutlineButton
              label="Preview"
              onPress={() => { hTap(); setPreviewOpen(true) }}
              style={s.previewBtn}
            />
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Publish Event"
                onPress={handleNext}
                disabled={nextLoading}
                loading={nextLoading}
              />
            </View>
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

      <EventPreviewOverlay
        visible={previewOpen}
        form={form}
        onClose={() => setPreviewOpen(false)}
      />
    </Screen>
  )
}

const s = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    backgroundColor: withOpacity(Colors.background, 0.55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    padding: 24,
    paddingTop: 20,
  },
  stepTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: Colors.inkPrimary,
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
  step5Footer: {
    flexDirection: 'row',
    gap: 12,
  },
  previewBtn: {
    width: 110,
  },
})
