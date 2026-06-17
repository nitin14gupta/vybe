import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'

const MAX_BODY = 300

const STAR_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Great', 'Amazing!']

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

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
      Alert.alert('Thanks!', 'Your review has been submitted.', [
        { text: 'Done', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message)
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
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Rate this Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Star row */}
        <View style={s.starSection}>
          <Text style={s.starPrompt}>How was the event?</Text>
          <View style={s.starRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <Pressable key={n} onPress={() => setRating(n)} style={s.starBtn}>
                <Star
                  size={42}
                  color={n <= rating ? '#FFB800' : Colors.divider}
                  fill={n <= rating ? '#FFB800' : 'transparent'}
                />
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text style={s.starLabel}>{STAR_LABELS[rating]}</Text>
          )}
        </View>

        {/* Text input */}
        <View style={s.textSection}>
          <Text style={s.textLabel}>Share your experience <Text style={s.optional}>(optional)</Text></Text>
          <TextInput
            style={s.textInput}
            placeholder="What made this event great? Any feedback for the host?"
            placeholderTextColor={Colors.inkDisabled}
            value={body}
            onChangeText={t => setBody(t.slice(0, MAX_BODY))}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{body.length}/{MAX_BODY}</Text>
        </View>
      </ScrollView>

      {/* Submit button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[s.submitBtn, rating === 0 && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          <LinearGradient
            colors={rating > 0 ? ['#FF6B35', '#FF3864'] : [Colors.elevated, Colors.elevated]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.submitGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[s.submitText, rating === 0 && s.submitTextDisabled]}>
                SUBMIT REVIEW
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
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
  scroll: { flex: 1 },
  content: { padding: 24, gap: 28 },
  starSection: { alignItems: 'center', gap: 16 },
  starPrompt: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  starRow: { flexDirection: 'row', gap: 6 },
  starBtn: { padding: 4 },
  starLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.brandOrange },
  textSection: { gap: 8 },
  textLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  optional: { color: Colors.inkDisabled, fontFamily: FontFamily.bodyRegular },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.divider,
    padding: 14,
    color: Colors.inkPrimary,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    minHeight: 120,
    lineHeight: 20,
  },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, textAlign: 'right' },
  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.divider,
    backgroundColor: 'rgba(17,17,17,0.95)',
  },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  submitBtnDisabled: {},
  submitGradient: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  submitText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#fff', letterSpacing: 0.5 },
  submitTextDisabled: { color: Colors.inkDisabled },
})
