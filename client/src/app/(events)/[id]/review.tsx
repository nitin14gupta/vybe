import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, MapPin, Star, Lock } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { hSelection, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, Radius } from '@/constants'
import ApiService, { type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { ConfettiRain, PrimaryButton } from '@/components/ui'

const MAX_BODY = 300
const STAR_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Great', 'Amazing!']

// ── AnimatedStar ──────────────────────────────────────────────────────────────

function AnimatedStar({ n, rating, onPress }: { n: number; rating: number; onPress: () => void }) {
  const scale = useSharedValue(1)
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const filled = n <= rating

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(1.08, { damping: 18, stiffness: 600 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 600 }) }}
      onPress={onPress}
      hitSlop={8}
    >
      <Animated.View style={aStyle}>
        <Star
          size={48}
          color={filled ? Colors.brandOrange : 'rgba(255,255,255,0.15)'}
          fill={filled ? Colors.brandOrange : 'transparent'}
          strokeWidth={1.4}
        />
      </Animated.View>
    </Pressable>
  )
}

// ── Not checked in gate ───────────────────────────────────────────────────────

function NotCheckedInGate({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[g.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Pressable style={g.back} onPress={onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
      </Pressable>
      <View style={g.body}>
        <View style={g.iconWrap}>
          <Lock size={36} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={g.title}>You didn't make it</Text>
        <Text style={g.sub}>
          Reviews are only for attendees who actually checked in at the event. Since you weren't scanned in, you can't leave a review.
        </Text>
      </View>
    </View>
  )
}

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 32 },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: -60 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.headingBold, fontSize: 24,
    color: Colors.inkPrimary, textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.inkSecondary, textAlign: 'center', lineHeight: 22,
  },
})

// ── Main screen ───────────────────────────────────────────────────────────────

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
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setEvent(ev)
        setCheckedIn(!!ev.my_checked_in_at)
        setAlreadyReviewed(!!ev.my_review_rating)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleStar = (n: number) => {
    hSelection()
    setRating(n)
  }

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
      const msg = e?.detail || "Couldn't submit review, try again"
      showPill(msg, 'error')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  if (checkedIn === false) {
    return <NotCheckedInGate onBack={() => router.back()} />
  }

  if (done) {
    return (
      <View style={[s.root, s.center]}>
        <ConfettiRain />
        <View style={s.successWrap}>
          <Text style={s.successStar}>⭐</Text>
          <Text style={s.successTitle}>Review Submitted!</Text>
          <Text style={s.successSub}>Thanks for rating the vibe.</Text>
          <PrimaryButton
            label="Back to Event"
            onPress={() => router.replace(`/(events)/${id}` as any)}
          />
          <Text style={s.countdownText}>Redirecting in {countdown}s…</Text>
        </View>
      </View>
    )
  }

  const cover = event?.cover_photos?.[0]?.url ?? null

  return (
    <View style={s.root}>
      {done && <ConfettiRain />}

      {/* Floating back */}
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
        {/* Event card */}
        {event && (
          <View style={s.card}>
            {cover ? (
              <Image source={{ uri: cover }} style={s.cardThumb} contentFit="cover" />
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

        {/* Rating section */}
        <View style={s.ratingSection}>
          <Text style={s.rateLabel}>TAP TO RATE</Text>

          <View style={s.stars}>
            {[1, 2, 3, 4, 5].map(n => (
              <AnimatedStar key={n} n={n} rating={rating} onPress={() => handleStar(n)} />
            ))}
          </View>

          {rating > 0 ? (
            <Text style={s.starWord}>{STAR_LABELS[rating]}</Text>
          ) : (
            <Text style={s.starWordEmpty}>How was the vibe?</Text>
          )}
        </View>

        {/* Text input */}
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

        {/* Submit */}
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

  // Event card
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

  // Rating
  ratingSection: { alignItems: 'center', gap: 14 },
  rateLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.inkDisabled,
    letterSpacing: 2,
  },
  stars: { flexDirection: 'row', gap: 10 },
  starWord: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.brandOrange,
    letterSpacing: -0.3,
  },
  starWordEmpty: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkDisabled,
  },

  // Input
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

  // Success state
  successWrap: { alignItems: 'center', gap: 12, paddingHorizontal: 40, width: '100%' },
  successStar: { fontSize: 64, marginBottom: 4 },
  successTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.inkPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    marginTop: 4,
  },
})
