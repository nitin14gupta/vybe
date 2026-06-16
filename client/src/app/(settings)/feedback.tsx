import { useState, useRef } from 'react'
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Screen, BackButton, PrimaryButton, ToastBanner } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import type { ToastType } from '@/components/ui'

export default function FeedbackScreen() {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ key: number; message: string; type: ToastType } | null>(null)
  const keyRef = useRef(0)

  const showToast = (message: string, type: ToastType) =>
    setToast({ key: ++keyRef.current, message, type })

  const handleSubmit = async () => {
    if (!text.trim()) {
      showToast('Please write something first', 'error')
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    setSubmitting(false)
    showToast('Thanks for your feedback!', 'success')
    setTimeout(() => router.back(), 1000)
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Send Feedback</Text>
        <View style={styles.headerEnd} />
      </View>

      <View style={styles.body}>
        <Text style={styles.hint}>
          Tell us what you love, what's broken, or what you'd like to see next.
        </Text>

        <TextInput
          style={styles.textarea}
          value={text}
          onChangeText={setText}
          placeholder="Your feedback..."
          placeholderTextColor={Colors.inkDisabled}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />

        <Text style={styles.charCount}>{text.length}/1000</Text>

        <PrimaryButton
          label="Send Feedback"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!text.trim()}
        />
      </View>

      {toast && (
        <ToastBanner key={toast.key} message={toast.message} type={toast.type} />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.screenPadding,
    paddingBottom: 8,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  headerEnd: { width: 40 },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 8,
    gap: 12,
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 21,
  },
  textarea: {
    height: 160,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    padding: 14,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 22,
  },
  charCount: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    textAlign: 'right',
  },
})
