import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, Image, StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
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

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      opacity={0.6}
    />
  )
}

function VybeRequestModalCore({ user, onSend, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [message, setMessage] = useState('')

  useEffect(() => { sheetRef.current?.present() }, [])

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
  const avatar = user.photos[0]?.url

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['85%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      onDismiss={handleClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <BottomSheetView style={s.content}>
        <View style={s.partnerRow}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarInitial}>{(user.name ?? '?').charAt(0)}</Text>
            </View>
          )}
          <View style={s.partnerInfo}>
            <Text style={s.partnerName}>{user.name ?? 'Someone'}</Text>
            {user.city ? <Text style={s.partnerCity}>{user.city}</Text> : null}
          </View>
          <View style={s.flameBadge}>
            <Flame size={18} color={Colors.brandOrange} fill={Colors.brandOrange} />
          </View>
        </View>

        <Text style={s.heading}>Send your vybe</Text>
        <Text style={s.sub}>Say something genuine — they can see this before deciding</Text>

        <View style={s.inputWrapper}>
          <TextInput
            style={s.input}
            value={message}
            onChangeText={t => t.length <= MAX_CHARS && setMessage(t)}
            placeholder="What made you want to connect?"
            placeholderTextColor={Colors.inkDisabled}
            multiline
            maxLength={MAX_CHARS}
            autoFocus
          />
          <Text style={[s.charCount, charsLeft < 20 && s.charCountWarn]}>
            {charsLeft}
          </Text>
        </View>

        <Pressable
          style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Flame size={16} color="#111" fill="#111" />
          <Text style={s.sendBtnText}>Send Vybe</Text>
        </Pressable>

        <Pressable onPress={handleClose} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function VybeRequestModal({ visible, user, onSend, onClose }: Props) {
  if (!visible || !user) return null
  return <VybeRequestModalCore user={user} onSend={onSend} onClose={onClose} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
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
  charCountWarn: { color: Colors.brandCoral },
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
  sendBtnDisabled: { opacity: 0.4 },
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
