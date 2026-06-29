import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Keyboard } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { MessageCircle } from 'lucide-react-native'
import { hSuccess } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

const MAX_CHARS = 150
const SNAP_POINTS = ['55%', '85%']

interface Props {
  visible: boolean
  partnerName: string | null
  onSend: (icebreaker: string) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.7} />
}

function VybeIcebreakerCore({ partnerName, onSend, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [message, setMessage] = useState('')

  useEffect(() => { sheetRef.current?.present() }, [])

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => sheetRef.current?.snapToIndex(1))
    const hide = Keyboard.addListener('keyboardDidHide', () => sheetRef.current?.snapToIndex(0))
    return () => { show.remove(); hide.remove() }
  }, [])

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed) return
    hSuccess()
    onSend(trimmed)
    setMessage('')
  }

  const charsLeft = MAX_CHARS - message.length
  const canSend = message.trim().length > 0

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <BottomSheetView style={s.content}>
        <View style={s.iconRow}>
          <View style={s.iconBg}>
            <MessageCircle size={28} color={Colors.brandOrange} strokeWidth={1.8} />
          </View>
        </View>
        <Text style={s.heading}>Write back to unlock the chat</Text>
        <Text style={s.sub}>
          {partnerName ? `${partnerName} accepted your vybe!` : 'Vybe accepted!'} Write an icebreaker to start the conversation.
        </Text>
        <View style={s.inputWrapper}>
          <TextInput
            style={s.input}
            value={message}
            onChangeText={t => t.length <= MAX_CHARS && setMessage(t)}
            placeholder="Start with something genuine..."
            placeholderTextColor={Colors.inkDisabled}
            multiline
            maxLength={MAX_CHARS}
            autoFocus
          />
          <Text style={[s.charCount, charsLeft < 20 && s.charCountWarn]}>{charsLeft}</Text>
        </View>
        <Pressable style={[s.sendBtn, !canSend && s.sendBtnDisabled]} onPress={handleSend} disabled={!canSend}>
          <Text style={s.sendBtnText}>Send & Start Chatting</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function VybeIcebreakerModal({ visible, ...rest }: Props) {
  if (!visible) return null
  return <VybeIcebreakerCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#1a1a1a' },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8 },
  iconRow: { alignItems: 'center', marginBottom: 16 },
  iconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,107,53,0.15)', alignItems: 'center', justifyContent: 'center' },
  heading: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, textAlign: 'center', marginBottom: 8 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  inputWrapper: { backgroundColor: '#222', borderRadius: 16, borderWidth: 1, borderColor: '#333', padding: 14, marginBottom: 16, minHeight: 100 },
  input: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 22, flex: 1 },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right', marginTop: 6 },
  charCountWarn: { color: Colors.brandCoral },
  sendBtn: { height: 52, borderRadius: 26, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: '#111' },
})
