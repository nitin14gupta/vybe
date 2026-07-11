import { useState, useEffect } from 'react'
import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import EmojiKeyboard, { type EmojiType } from 'rn-emoji-keyboard'
import { Reply, Copy, Flag, Trash2, Undo2, Pencil } from 'lucide-react-native'
import { hSelection, hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍']
const SCREEN_HEIGHT = Dimensions.get('window').height
const PICKER_HEIGHT = 64
const ACTION_ROW_HEIGHT = 50
const GAP = 8

interface Props {
  msgId: string
  pageY: number
  isMine: boolean
  currentEmoji: string | null
  canCopy: boolean
  canEdit: boolean
  onSelect: (msgId: string, emoji: string | null) => void
  onReply: () => void
  onCopy: () => void
  onReport: () => void
  onDelete: () => void
  onEdit: () => void
  onClose: () => void
}

export function EmojiPickerOverlay({
  msgId, pageY, isMine, currentEmoji, canCopy, canEdit,
  onSelect, onReply, onCopy, onReport, onDelete, onEdit, onClose,
}: Props) {
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

  const actionRowCount = 1 + (canCopy ? 1 : 0) + (isMine && canEdit ? 1 : 0) + (!isMine ? 1 : 0) + 1 // reply, copy?, edit?, report?, delete/unsend
  const actionCardHeight = actionRowCount * ACTION_ROW_HEIGHT + 8
  const totalHeight = PICKER_HEIGHT + GAP + actionCardHeight

  const showAbove = pageY > SCREEN_HEIGHT * 0.5
  const top = showAbove ? pageY - totalHeight - 12 : pageY + 48

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

  const runAction = (fn: () => void) => { hTap(); fn(); onClose() }

  return (
    <>
      <Modal transparent animationType="none" onRequestClose={onClose} visible={!showFullPicker}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <Animated.View style={[s.menu, { top, alignSelf: isMine ? 'flex-end' : 'flex-start' }, animStyle]}>
          <View style={s.picker}>
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
          </View>

          <View style={s.actionCard}>
            <Pressable style={s.actionRow} onPress={() => runAction(onReply)} hitSlop={2}>
              <Reply size={19} color={Colors.inkSecondary} strokeWidth={1.8} />
              <Text style={s.actionText}>Reply</Text>
            </Pressable>
            {canCopy && (
              <Pressable style={s.actionRow} onPress={() => runAction(onCopy)} hitSlop={2}>
                <Copy size={19} color={Colors.inkSecondary} strokeWidth={1.8} />
                <Text style={s.actionText}>Copy</Text>
              </Pressable>
            )}
            {isMine && canEdit && (
              <Pressable style={s.actionRow} onPress={() => runAction(onEdit)} hitSlop={2}>
                <Pencil size={19} color={Colors.inkSecondary} strokeWidth={1.8} />
                <Text style={s.actionText}>Edit</Text>
              </Pressable>
            )}
            {!isMine && (
              <Pressable style={s.actionRow} onPress={() => runAction(onReport)} hitSlop={2}>
                <Flag size={19} color={Colors.inkSecondary} strokeWidth={1.8} />
                <Text style={s.actionText}>Report</Text>
              </Pressable>
            )}
            <Pressable style={s.actionRow} onPress={() => runAction(onDelete)} hitSlop={2}>
              {isMine
                ? <Undo2 size={19} color={Colors.inkSecondary} strokeWidth={1.8} />
                : <Trash2 size={19} color={Colors.inkSecondary} strokeWidth={1.8} />
              }
              <Text style={[s.actionText, s.actionTextDanger]}>{isMine ? 'Unsend' : 'Delete for me'}</Text>
            </Pressable>
          </View>
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
  menu: {
    position: 'absolute',
    marginHorizontal: 16,
    gap: GAP,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1e1e1e',
    borderRadius: 32,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
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
  actionCard: {
    minWidth: 210,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    height: ACTION_ROW_HEIGHT,
  },
  actionText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  actionTextDanger: { color: Colors.brandCoral },
})
