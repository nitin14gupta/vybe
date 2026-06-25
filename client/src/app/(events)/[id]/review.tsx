import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import { hSelection, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

const MAX_BODY = 300

const STAR_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Great', 'Amazing!']

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const showPill = usePillStore(s => s.show)

  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ApiService.getMyReview(id)
      .then(existing => {
        if (existing) {
          setRating(existing.rating)
          setBody(existing.body ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return
    setSubmitting(true)
    try {
      await ApiService.submitReview(id!, rating, body.trim() || undefined)
      showPill('Review submitted — thanks!', 'success')
      setTimeout(() => router.back(), 1200)
    } catch (e: any) {
      showPill("Couldn't submit your review, try again", 'error')
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

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Rate the Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.prompt}>How was it?</Text>

        {/* Star row */}
        <View style={s.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <Pressable key={n} onPress={() => { hSelection(); setRating(n) }} hitSlop={6}>
              <Star
                size={40}
                color={n <= rating ? Colors.accentGold : Colors.inkDisabled}
                fill={n <= rating ? Colors.accentGold : 'transparent'}
                strokeWidth={1.5}
              />
            </Pressable>
          ))}
        </View>
        {rating > 0 && <Text style={s.starLabel}>{STAR_LABELS[rating]}</Text>}

        <TextInput
          style={s.input}
          value={body}
          onChangeText={t => t.length <= MAX_BODY && setBody(t)}
          placeholder="Share what made it memorable (optional)"
          placeholderTextColor={Colors.inkDisabled}
          multiline
          maxLength={MAX_BODY}
        />
        <Text style={s.charCount}>{body.length}/{MAX_BODY}</Text>

        <Pressable
          style={[s.submitBtn, rating === 0 && s.submitBtnDisabled]}
          onPress={() => { hSuccess(); handleSubmit() }}
          disabled={rating === 0 || submitting}
        >
          <LinearGradient
            colors={rating > 0 ? ['#FF6B35', '#FF3864'] : ['#333', '#333']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.submitGradient}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>Submit Review</Text>}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  content: { padding: 24, gap: 16 },
  prompt: { fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 8 },
  starLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.accentGold, textAlign: 'center' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, textAlign: 'right', marginTop: -8 },
  submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: '#fff' },
})
