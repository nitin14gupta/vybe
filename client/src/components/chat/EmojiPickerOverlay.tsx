import { useState, useEffect } from 'react'
import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import EmojiKeyboard, { type EmojiType } from 'rn-emoji-keyboard'
import { hSelection, hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍']
const SCREEN_HEIGHT = Dimensions.get('window').height
const PICKER_HEIGHT = 64

interface Props {
  msgId: string
  pageY: number
  isMine: boolean
  currentEmoji: string | null
  onSelect: (msgId: string, emoji: string | null) => void
  onClose: () => void
}

export function EmojiPickerOverlay({ msgId, pageY, isMine, currentEmoji, onSelect, onClose }: Props) {
  const [showFullPicker, setShowFullPicker] = useState(false)
  const scale = useSharedValue(0.7)
  const opacity = useSharedValue(0)

  useEffect(() => {
    scale.value = withTiming(1, { duration: 180 })
    opacity.value = withTiming(1, { duration: 140 })
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const showAbove = pageY > SCREEN_HEIGHT * 0.6
  const top = showAbove ? pageY - PICKER_HEIGHT - 12 : pageY + 48

  const handleSelect = (emoji: string) => {
    const next = currentEmoji === emoji ? null : emoji
    onSelect(msgId, next)
    onClose()
  }

  const handleFullPickerSelect = ({ emoji }: EmojiType) => {
    onSelect(msgId, emoji)
    setShowFullPicker(false)
    onClose()
  }

  return (
    <>
      <Modal transparent animationType="none" onRequestClose={onClose} visible={!showFullPicker}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <Animated.View style={[s.picker, { top, alignSelf: isMine ? 'flex-end' : 'flex-start' }, animStyle]}>
          {QUICK_EMOJIS.map(emoji => (
            <Pressable
              key={emoji}
              style={[s.emojiBtn, currentEmoji === emoji && s.emojiBtnActive]}
              onPress={() => { hSelection(); handleSelect(emoji) }}
              hitSlop={4}
            >
              <Text style={s.emojiText}>{emoji}</Text>
            </Pressable>
          ))}
          <Pressable style={s.moreBtnWrap} onPress={() => { hTap(); setShowFullPicker(true) }} hitSlop={4}>
            <Text style={s.moreBtnText}>+</Text>
          </Pressable>
        </Animated.View>
      </Modal>

      <EmojiKeyboard
        open={showFullPicker}
        onClose={() => { setShowFullPicker(false); onClose() }}
        onEmojiSelected={handleFullPickerSelect}
        enableSearchBar
        theme={{
          backdrop: 'rgba(0,0,0,0.7)',
          knob: Colors.brandOrange,
          container: '#1a1a1a',
          header: '#222',
          skinTonesContainer: '#1a1a1a',
          category: {
            icon: Colors.inkSecondary,
            iconActive: Colors.brandOrange,
            container: '#222',
            containerActive: 'rgba(255,107,53,0.15)',
          },
          search: {
            background: '#222',
            text: Colors.inkPrimary,
            placeholder: Colors.inkDisabled,
            icon: Colors.inkSecondary,
          },
          emoji: {
            selected: 'rgba(255,107,53,0.2)',
          },
        }}
      />
    </>
  )
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  picker: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 32,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnActive: {
    backgroundColor: 'rgba(255,107,53,0.2)',
  },
  emojiText: { fontSize: 24 },
  moreBtnWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  moreBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkSecondary,
    lineHeight: 20,
  },
})
