import { useState } from 'react'
import {
  Modal, View, Text, TextInput, Pressable, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Flame } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import type { DiscoverUser } from '@/api/apiService'

const MAX_CHARS = 150

interface Props {
  visible: boolean
  user: DiscoverUser | null
  onSend: (message: string) => void
  onClose: () => void
}

export function VybeRequestModal({ visible, user, onSend, onClose }: Props) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed) return
    onSend(trimmed)
    setMessage('')
  }

  const handleClose = () => {
    setMessage('')
    onClose()
  }

  const charsLeft = MAX_CHARS - message.length
  const canSend = message.trim().length > 0

  if (!user) return null

  const avatar = user.photos[0]?.url

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Partner preview */}
          <View style={styles.partnerRow}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{(user.name ?? '?').charAt(0)}</Text>
              </View>
            )}
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{user.name ?? 'Someone'}</Text>
              {user.city ? <Text style={styles.partnerCity}>{user.city}</Text> : null}
            </View>
            <View style={styles.flameBadge}>
              <Flame size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Send your vybe</Text>
          <Text style={styles.sub}>Say something genuine — they can see this before deciding</Text>

          {/* Message input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={t => t.length <= MAX_CHARS && setMessage(t)}
              placeholder="What made you want to connect?"
              placeholderTextColor={Colors.inkDisabled}
              multiline
              maxLength={MAX_CHARS}
              autoFocus
            />
            <Text style={[styles.charCount, charsLeft < 20 && styles.charCountWarn]}>
              {charsLeft}
            </Text>
          </View>

          {/* Actions */}
          <Pressable
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Flame size={16} color="#111" fill="#111" />
            <Text style={styles.sendBtnText}>Send Vybe</Text>
          </Pressable>

          <Pressable onPress={handleClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.brandOrange,
  },
  avatarFallback: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
  },
  partnerInfo: { flex: 1, marginLeft: 12 },
  partnerName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
  },
  partnerCity: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  flameBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    marginBottom: 4,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginBottom: 20,
    lineHeight: 18,
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
  charCountWarn: {
    color: Colors.brandCoral,
  },
  sendBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: '#111',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
})
