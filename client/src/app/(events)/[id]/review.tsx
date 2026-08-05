import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, MapPin, Star } from 'lucide-react-native'
import { hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, Radius } from '@/constants'
import ApiService, { type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { ConfettiRain, PrimaryButton, BrandedLoader } from '@/components/ui'
import { StarRatingPicker, NotCheckedInGate, ReviewSuccessState } from '@/components/reviews/ReviewSubmitParts'

const MAX_BODY = 300

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const showPill = usePillStore(s => s.show)

  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [checkedIn, setCheckedIn] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setEvent(ev)
        setCheckedIn(!!ev.my_checked_in_at)
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (rating === 0) { showPill('Pick a star rating first', 'error'); return }
    if (submitting) return
    setSubmitting(true)
    try {
      await ApiService.submitReview(id!, rating, body.trim() || undefined)
      hSuccess()
      setDone(true)
      let secs = 5
      const tick = setInterval(() => {
        secs -= 1
        setCountdown(secs)
        if (secs <= 0) {
          clearInterval(tick)
          router.replace(`/(events)/${id}` as any)
        }
      }, 1000)
    } catch (e: any) {
      const msg = e?.message || "Couldn't submit review, try again"
      showPill(msg, 'error')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  if (checkedIn === false) {
    return <NotCheckedInGate onBack={() => router.back()} />
  }

  if (done) {
    return (
      <View style={[s.root, s.center]}>
        <ReviewSuccessState countdown={countdown} onBack={() => router.replace(`/(events)/${id}` as any)} />
      </View>
    )
  }

  const cover = event?.cover_photos?.[0]?.url ?? null

  return (
    <View style={s.root}>
      {done && <ConfettiRain />}

      <View style={[s.floatBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable style={s.circleBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {event && (
          <View style={s.card}>
            {cover ? (
              <Image
                source={{ uri: cover }}
                style={s.cardThumb}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="normal"
                transition={150}
              />
            ) : (
              <View style={[s.cardThumb, s.cardThumbFallback]}>
                <Star size={22} color={Colors.inkDisabled} />
              </View>
            )}
            <View style={s.cardInfo}>
              <Text style={s.cardTitle} numberOfLines={2}>{event.title}</Text>
              {event.location_name && (
                <View style={s.cardLocation}>
                  <MapPin size={12} color={Colors.inkSecondary} strokeWidth={1.5} />
                  <Text style={s.cardLocationText} numberOfLines={1}>{event.location_name}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <StarRatingPicker rating={rating} onSelect={setRating} />

        <View style={s.inputSection}>
          <Text style={s.sectionLabel}>SHARE THE EXPERIENCE</Text>
          <TextInput
            style={s.input}
            value={body}
            onChangeText={t => t.length <= MAX_BODY && setBody(t)}
            placeholder="What was the highlight of your night?"
            placeholderTextColor={Colors.inkDisabled}
            multiline
            textAlignVertical="top"
            maxLength={MAX_BODY}
          />
          <Text style={s.charCount}>{body.length}/{MAX_BODY}</Text>
        </View>

        <PrimaryButton
          label="Submit Review"
          onPress={handleSubmit}
          disabled={rating === 0}
          loading={submitting}
        />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  floatBar: {
    position: 'absolute', left: 16, right: 16,
    zIndex: 10,
  },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 20, gap: 28 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
  },
  cardThumb: {
    width: 72, height: 72,
    borderRadius: 12,
  },
  cardThumbFallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 6 },
  cardTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: Colors.inkPrimary,
    lineHeight: 22,
  },
  cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLocationText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    flex: 1,
  },

  inputSection: { gap: 10 },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.inkDisabled,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    minHeight: 130,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    textAlign: 'right',
  },
})
