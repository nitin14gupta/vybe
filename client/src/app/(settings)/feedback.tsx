import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Send } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { AppHeader, HeaderIconBtn } from '@/components/ui'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hSuccess, hTap } from '@/lib/haptics'

export default function FeedbackScreen() {
  const insets   = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const [text, setText]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSend = text.trim().length > 0

  const handleSubmit = async () => {
    if (!canSend || submitting) return
    hTap()
    setSubmitting(true)
    try {
      await ApiService.submitFeedback(text.trim())
      hSuccess()
      showPill('Thanks for your feedback! We read everything.', 'default')
      router.back()
    } catch {
      showPill('Failed to send. Please try again.', 'error')
      setSubmitting(false)
    }
  }

  return (
    <View style={[s.root]}>
      <AppHeader
        title="Send Feedback"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.hint}>
          Tell us what you love, what's broken, or what you'd like to see next. Every message is read by the team.
        </Text>

        <View style={s.inputCard}>
          <TextInput
            style={s.textarea}
            value={text}
            onChangeText={setText}
            placeholder="Your thoughts..."
            placeholderTextColor={Colors.inkDisabled}
            multiline
            textAlignVertical="top"
            maxLength={1000}
            autoFocus
          />
          <Text style={s.charCount}>{text.length}/1000</Text>
        </View>

        <Pressable
          style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSend || submitting}
        >
          <Send size={16} color="#111" strokeWidth={2} />
          <Text style={s.sendText}>{submitting ? 'Sending…' : 'Send Feedback'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },

  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 21 },

  inputCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.divider, padding: 14 },
  textarea: { minHeight: 160, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 22 },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right', marginTop: 8 },

  sendBtn: { height: 56, borderRadius: 28, backgroundColor: Colors.brandOrange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#111' },
})
