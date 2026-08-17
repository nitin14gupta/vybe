import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, Keyboard } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { MessageCircle } from 'lucide-react-native'
import { hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from './PrimaryButton'

const MAX_CHARS = 150
const SNAP_POINTS = ['86%', '85%']

interface Props {
  visible: boolean
  partnerName: string | null
  onSend: (icebreaker: string) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.7} />
}

function VibeIcebreakerCore({ partnerName, onSend, onClose }: Omit<Props, 'visible'>) {
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
          {partnerName ? `${partnerName} accepted your vibe!` : 'Vibe accepted!'} Write an icebreaker to start the conversation.
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
        <PrimaryButton label="Send & Start Chatting" onPress={handleSend} disabled={!canSend} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function VibeIcebreakerModal({ visible, ...rest }: Props) {
  if (!visible) return null
  return <VibeIcebreakerCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8 },
  iconRow: { alignItems: 'center', marginBottom: 16 },
  iconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: withOpacity(Colors.brandOrange, 0.15), alignItems: 'center', justifyContent: 'center' },
  heading: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, textAlign: 'center', marginBottom: 8 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  inputWrapper: { backgroundColor: Colors.elevated, borderRadius: 16, borderWidth: 1, borderColor: Colors.grayBorder, padding: 14, marginBottom: 16, minHeight: 100 },
  input: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 22, flex: 1 },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right', marginTop: 6 },
  charCountWarn: { color: Colors.brandCoral },
})
