import { useState } from 'react'
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Linking, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Mail, ChevronRight } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'

const SUPPORT_EMAIL = 'support@vybe.in'

const TOPICS = [
  { id: 'refund',    label: 'Wallet refund to bank',     subject: 'Wallet Refund Request' },
  { id: 'payment',  label: 'Payment issue',              subject: 'Payment Issue' },
  { id: 'event',    label: 'Issue with an event',        subject: 'Event Issue' },
  { id: 'account',  label: 'Account / profile problem',  subject: 'Account Issue' },
  { id: 'other',    label: 'Something else',             subject: 'Support Request' },
]

export default function SupportScreen() {
  const insets   = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [message, setMessage]             = useState('')
  const [sending, setSending]             = useState(false)

  const topic = TOPICS.find(t => t.id === selectedTopic)
  const canSend = !!selectedTopic && message.trim().length > 10

  const handleSend = async () => {
    if (!canSend || !topic) return
    hTap()
    setSending(true)
    try {
      // Save to backend first
      await ApiService.submitSupport(topic.id, message.trim())
      hSuccess()
      // Also open mail app so they have a copy
      const subject = encodeURIComponent(`[Vybe] ${topic.subject}`)
      const body    = encodeURIComponent(message.trim())
      const url     = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) await Linking.openURL(url)
      showPill('Support request sent! We\'ll reply within 1–2 business days.', 'default')
      router.back()
    } catch {
      showPill('Failed to send. Please try again or email us directly.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Contact Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.heroRow}>
          <View style={s.heroIcon}>
            <Mail size={28} color={Colors.brandOrange} strokeWidth={1.8} />
          </View>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>We're here to help</Text>
            <Text style={s.heroSub}>We reply within 1–2 business days</Text>
          </View>
        </View>

        {/* Topic picker */}
        <Text style={s.sectionLabel}>WHAT'S THE ISSUE?</Text>
        <View style={s.topicCard}>
          {TOPICS.map((t, i) => (
            <Pressable
              key={t.id}
              style={[
                s.topicRow,
                i < TOPICS.length - 1 && s.topicBorder,
                selectedTopic === t.id && s.topicRowSelected,
              ]}
              onPress={() => { hTap(); setSelectedTopic(t.id) }}
            >
              <View style={[s.radio, selectedTopic === t.id && s.radioSelected]}>
                {selectedTopic === t.id && <View style={s.radioDot} />}
              </View>
              <Text style={[s.topicLabel, selectedTopic === t.id && s.topicLabelSelected]}>
                {t.label}
              </Text>
              {selectedTopic !== t.id && (
                <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={1.8} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Message */}
        <Text style={s.sectionLabel}>DESCRIBE YOUR ISSUE</Text>
        <View style={s.inputCard}>
          <TextInput
            style={s.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us what happened, what you expected, and any relevant details (e.g. event name, amount, date)…"
            placeholderTextColor={Colors.inkDisabled}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{message.length}/1000</Text>
        </View>

        {/* Refund note */}
        {selectedTopic === 'refund' && (
          <View style={s.noteCard}>
            <Text style={s.noteText}>
              For wallet refund requests, please mention your registered phone number and the event(s) you were refunded for. We process bank transfers manually and typically take 5–10 business days.
            </Text>
          </View>
        )}

        {/* Send button */}
        <Pressable
          style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend || sending}
        >
          {sending
            ? <ActivityIndicator color="#111" />
            : <>
                <Mail size={16} color="#111" strokeWidth={2} />
                <Text style={s.sendText}>Send via Email</Text>
              </>
          }
        </Pressable>

        <Text style={s.directEmail}>
          Or write directly to{' '}
          <Text style={s.emailLink} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
        </Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },

  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,107,53,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 },
  heroTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  heroSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },

  sectionLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.88, color: Colors.inkSecondary, marginLeft: 2, marginTop: 4 },

  topicCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  topicBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  topicRowSelected: { backgroundColor: 'rgba(255,107,53,0.06)' },
  topicLabel: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary },
  topicLabelSelected: { fontFamily: FontFamily.bodyMedium, color: Colors.brandOrange },

  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.inkDisabled, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.brandOrange },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brandOrange },

  inputCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16 },
  input: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 22, minHeight: 120 },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right', marginTop: 8 },

  noteCard: { backgroundColor: 'rgba(255,107,53,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,53,0.18)', padding: 14 },
  noteText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 19 },

  sendBtn: { height: 56, borderRadius: 28, backgroundColor: Colors.brandOrange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#111' },

  directEmail: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, textAlign: 'center', marginTop: 4 },
  emailLink: { color: Colors.brandOrange, fontFamily: FontFamily.bodyMedium },
})
