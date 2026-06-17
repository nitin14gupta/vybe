import { useState } from 'react'
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { MessageCircle } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

const MAX_CHARS = 150

interface Props {
  visible: boolean
  partnerName: string | null
  onSend: (icebreaker: string) => void
  onClose: () => void
}

export function VybeIcebreakerModal({ visible, partnerName, onSend, onClose }: Props) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed) return
    onSend(trimmed)
    setMessage('')
  }

  const charsLeft = MAX_CHARS - message.length
  const canSend = message.trim().length > 0

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.iconRow}>
            <View style={styles.iconBg}>
              <MessageCircle size={28} color={Colors.brandOrange} strokeWidth={1.8} />
            </View>
          </View>

          <Text style={styles.heading}>Write back to unlock the chat</Text>
          <Text style={styles.sub}>
            {partnerName ? `${partnerName} accepted your vybe!` : 'Vybe accepted!'} Write an icebreaker to start the conversation.
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={t => t.length <= MAX_CHARS && setMessage(t)}
              placeholder="Start with something genuine..."
              placeholderTextColor={Colors.inkDisabled}
              multiline
              maxLength={MAX_CHARS}
              autoFocus
            />
            <Text style={[styles.charCount, charsLeft < 20 && styles.charCountWarn]}>
              {charsLeft}
            </Text>
          </View>

          <Pressable
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Text style={styles.sendBtnText}>Send & Start Chatting</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconRow: { alignItems: 'center', marginBottom: 16 },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputWrapper: {
    backgroundColor: '#222',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 14,
    marginBottom: 16,
    minHeight: 100,
  },
  input: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 22,
    flex: 1,
  },
  charCount: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    textAlign: 'right',
    marginTop: 6,
  },
  charCountWarn: { color: Colors.brandCoral },
  sendBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: '#111',
  },
})
