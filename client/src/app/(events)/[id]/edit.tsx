import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { hSuccess } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import { DateTimePickerSheet } from '@/components/ui'
import { Step1Basics, Step2When, Step3Where, Step4Pricing, Step5Photos } from '@/components/event-form'
import { useCreateEvent, type CreateEventForm } from '@/hooks/useCreateEvent'
import { useEventDateTimePickers } from '@/hooks/useEventDateTimePickers'
import ApiService, { type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { form, set } = useCreateEvent()
  const { openDate, openStartTime, openEndDate, openEndTime, picker } = useEventDateTimePickers(form, set)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)
  const [capacityLocked, setCapacityLocked] = useState(false)
  const [hasAttendees, setHasAttendees] = useState(false)
  const [bookedCount, setBookedCount] = useState(0)
  const [largeDateShiftPending, setLargeDateShiftPending] = useState(false)
  const showPill = usePillStore(s => s.show)

  type Snapshot = {
    title: string; eventType: string; description: string; rules: string
    capacity: number; ageRestriction: number; locationName: string
    locationLat: number | null; locationLng: number | null
    isFree: boolean; priceInr: number; coverPhotos: string
    dateTime: number | null; endTime: number | null
  }
  const originalRef = useRef<Snapshot | null>(null)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then((ev: EventDetail) => {
        // Populate shared form from existing event data
        set('title', ev.title)
        set('eventType', ev.event_type)
        set('description', ev.description ?? '')
        set('rules', ev.rules ?? '')
        set('capacity', ev.capacity)
        set('ageRestriction', (ev.age_restriction as 18 | 21 | 25) ?? 18)
        set('locationName', ev.location_name ?? '')
        set('locationLat', ev.location_lat)
        set('locationLng', ev.location_lng)
        set('isFree', ev.is_free)
        set('priceInr', ev.price_inr)
        set('coverPhotos', ev.cover_photos?.map((p: { url: string }) => p.url) ?? [])

        const parseTs = (s: string) => new Date(s.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
        const dt = parseTs(ev.date_time)
        set('dateTime', dt)
        if (ev.end_time) set('endTime', parseTs(ev.end_time))

        const editDeadline = parseTs(ev.edit_deadline)
        if (new Date() > editDeadline) setLocked(true)
        const capDeadline = new Date(parseTs(ev.date_time).getTime() - 2 * 60 * 60 * 1000)
        if (new Date() > capDeadline) setCapacityLocked(true)
        if (ev.attendee_count > 0) setHasAttendees(true)
        setBookedCount(ev.attendee_count)

        originalRef.current = {
          title: ev.title,
          eventType: ev.event_type,
          description: ev.description ?? '',
          rules: ev.rules ?? '',
          capacity: ev.capacity,
          ageRestriction: (ev.age_restriction as number) ?? 18,
          locationName: ev.location_name ?? '',
          locationLat: ev.location_lat,
          locationLng: ev.location_lng,
          isFree: ev.is_free,
          priceInr: ev.price_inr,
          coverPhotos: JSON.stringify(ev.cover_photos?.map((p: { url: string }) => p.url) ?? []),
          dateTime: parseTs(ev.date_time).getTime(),
          endTime: ev.end_time ? parseTs(ev.end_time).getTime() : null,
        }
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (skipLargeDateCheck = false) => {
    if (saving || (locked && capacityLocked)) return

    if (!form.title.trim()) { showPill('Title is required', 'error'); return }
    if (!form.isFree && form.priceInr < 99) { showPill('Minimum ticket price is ₹99', 'error'); return }

    if (form.capacity < bookedCount) {
      showPill(`${bookedCount} spots already booked — can't reduce below this`, 'error')
      return
    }

    if (!form.coverPhotos[0]) {
      showPill('Cover photo is required', 'error')
      return
    }

    const start = form.dateTime ? new Date(form.dateTime) : new Date()
    const end = form.endTime ? new Date(form.endTime) : null
    const o = originalRef.current

    const startChanged = o ? start.getTime() !== o.dateTime : false
    const endChanged = o ? (end?.getTime() ?? null) !== o.endTime : false

    if (startChanged) {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
      if (start < twoHoursFromNow) {
        showPill('Start time must be at least 2 hours from now', 'error')
        return
      }
    }

    if (end && (startChanged || endChanged)) {
      const durMs = end.getTime() - start.getTime()
      if (durMs <= 0) { showPill('End time must be after start time', 'error'); return }
      if (durMs < 60 * 60 * 1000) { showPill('Event must be at least 1 hour long', 'error'); return }
      if (durMs > 72 * 60 * 60 * 1000) { showPill("Events can't run longer than 3 days", 'error'); return }
    }

    if (!skipLargeDateCheck && startChanged && o?.dateTime) {
      const daysDiff = Math.abs(start.getTime() - o.dateTime) / (1000 * 60 * 60 * 24)
      if (daysDiff > 7) {
        setLargeDateShiftPending(true)
        return
      }
    }

    setLargeDateShiftPending(false)
    setSaving(true)
    try {
      const uploadedUrls = (await Promise.all(
        form.coverPhotos.map(async (uri, index) => {
          if (!uri) return null
          if (uri.startsWith('http')) return uri
          return await ApiService.uploadEventPhoto(uri, index)
        })
      )).filter(Boolean) as string[]

      await ApiService.updateEvent(id!, {
        title: form.title.trim(),
        event_type: form.eventType,
        description: form.description.trim() || undefined,
        rules: form.rules.trim() || undefined,
        date_time: start.toISOString(),
        end_time: end ? end.toISOString() : undefined,
        capacity: form.capacity,
        age_restriction: form.ageRestriction,
        location_name: form.locationName.trim() || undefined,
        location_lat: form.locationLat ?? undefined,
        location_lng: form.locationLng ?? undefined,
        price_inr: form.isFree ? 0 : form.priceInr,
        cover_photos: uploadedUrls,
      })
      router.back()
    } catch (e: any) {
      if (e?.status === 403) {
        showPill('Editing window has passed — event starts too soon', 'error')
      } else {
        showPill("Couldn't save your changes, try again", 'error')
      }
      setSaving(false)
    }
  }

  const o = originalRef.current
  const isDirty = o !== null && (
    form.title !== o.title ||
    form.eventType !== o.eventType ||
    form.description !== o.description ||
    form.rules !== o.rules ||
    form.capacity !== o.capacity ||
    form.ageRestriction !== o.ageRestriction ||
    form.locationName !== o.locationName ||
    form.locationLat !== o.locationLat ||
    form.locationLng !== o.locationLng ||
    form.isFree !== o.isFree ||
    form.priceInr !== o.priceInr ||
    JSON.stringify(form.coverPhotos) !== o.coverPhotos ||
    (form.dateTime?.getTime() ?? null) !== o.dateTime ||
    (form.endTime?.getTime() ?? null) !== o.endTime
  )

  const hasCoverPhoto = !!form.coverPhotos[0]
  const isValid = hasCoverPhoto
  const canSave = isDirty && isValid

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Edit Event</Text>
        <View style={{ width: 40 }} />
      </View>

      {locked && (
        <View style={s.lockedBanner}>
          <Text style={s.lockedText}>
            {capacityLocked
              ? 'Editing closed — event starts in under 2 hours'
              : 'Event is locked for editing. You can still increase capacity to let in waitlisted guests.'}
          </Text>
        </View>
      )}

      {largeDateShiftPending && (
        <View style={s.dateShiftBanner}>
          <Text style={s.dateShiftTitle}>Large date change</Text>
          <Text style={s.dateShiftBody}>
            You moved this event by more than 7 days. All attendees will be notified and given 48 hours to cancel for a full refund.
          </Text>
          <View style={s.dateShiftBtns}>
            <Pressable style={s.dateShiftCancel} onPress={() => setLargeDateShiftPending(false)}>
              <Text style={s.dateShiftCancelText}>Go back</Text>
            </Pressable>
            <Pressable style={s.dateShiftConfirm} onPress={() => handleSave(true)}>
              <Text style={s.dateShiftConfirmText}>Yes, update</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — Basics */}
        <Step1Basics
          form={form} set={set} errors={errors} setErrors={setErrors}
          scrollable={false} disabled={locked}
        />

        {/* Step 2 — When & who */}
        <Step2When
          form={form} set={set} errors={errors} setErrors={setErrors}
          openDate={openDate} openStartTime={openStartTime} openEndDate={openEndDate} openEndTime={openEndTime}
          scrollable={false} disabled={locked}
          capacityUnlocked={locked && !capacityLocked}
          ageLocked={hasAttendees}
          ageLockNote="Locked — attendees already joined"
          minCapacity={Math.max(5, bookedCount)}
          capacityNote={bookedCount > 0 ? `${bookedCount} spot${bookedCount === 1 ? '' : 's'} already booked — can't reduce below this` : undefined}
        />

        {/* Step 3 — Where (inline map) */}
        <Step3Where
          form={form} set={set} errors={errors} setErrors={setErrors}
          disabled={locked} inline
        />

        {/* Step 4 — Pricing & photos */}
        <Step4Pricing
          form={form} set={set} errors={errors} setErrors={setErrors}
          scrollable={false} disabled={locked}
          priceLocked={hasAttendees}
          priceLockNote="Locked — attendees already booked"
        />

        {/* Step 5 — Photos */}
        <Step5Photos
          form={form} set={set} errors={errors} setErrors={setErrors}
          disabled={locked} inline
        />
      </ScrollView>

      {(!locked || (locked && !capacityLocked)) && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
            onPress={() => { if (!isDirty) return; hSuccess(); handleSave() }}
            disabled={saving || !isDirty}
          >
            <LinearGradient
              colors={canSave ? ['#FF6B35', '#FF3864'] : ['#333', '#333']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.saveGradient}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.saveText}>Save Changes</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}

      <DateTimePickerSheet
        visible={picker.visible}
        mode={picker.mode}
        value={picker.value}
        onConfirm={picker.confirm}
        onDismiss={picker.dismiss}
      />
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  lockedBanner: {
    backgroundColor: 'rgba(255,56,100,0.12)',
    borderBottomWidth: 1, borderBottomColor: Colors.brandCoral,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  lockedText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandCoral, textAlign: 'center' },

  dateShiftBanner: {
    backgroundColor: 'rgba(255,184,48,0.08)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,184,48,0.3)',
    paddingVertical: 14, paddingHorizontal: 20, gap: 8,
  },
  dateShiftTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.accentGold },
  dateShiftBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 18 },
  dateShiftBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dateShiftCancel: {
    flex: 1, height: 38, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  dateShiftCancelText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  dateShiftConfirm: {
    flex: 1, height: 38, borderRadius: 20,
    backgroundColor: Colors.accentGold,
    alignItems: 'center', justifyContent: 'center',
  },
  dateShiftConfirmText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: '#111' },

  scroll: { flex: 1 },
  content: { padding: 20, gap: 12 },
  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    // borderTopWidth: 1, borderTopColor: Colors.divider,
    backgroundColor: 'rgba(17,17,17,0.95)',
  },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.5 },
  saveGradient: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  saveText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#fff', letterSpacing: 0.5 },
})
