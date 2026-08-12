import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Bookmark } from 'lucide-react-native'
import { Colors } from '@/constants'
import { useHotlistToggle } from '@/hooks/useHotlistToggle'

// A real sibling Pressable meant to sit absolutely-positioned on top of a
// card's own Pressable (never nested inside it — see the note on HostPill in
// EventCard.tsx for why: nested touchables break both the tap and the
// child's own background rendering on Android). Overlapping sibling
// Pressables hit-test correctly with zero coordinate math.
export function HotlistButton({
  eventId,
  initial,
  style,
  size = 15,
}: {
  eventId: string
  initial?: boolean
  style?: StyleProp<ViewStyle>
  size?: number
}) {
  const { hotlisted, toggle } = useHotlistToggle(eventId, initial)

  return (
    <Pressable style={[s.btn, style]} onPress={toggle} hitSlop={8}>
      <Bookmark
        size={size}
        color={hotlisted ? Colors.brandCoral : '#fff'}
        fill={hotlisted ? Colors.brandCoral : 'transparent'}
        strokeWidth={2}
      />
    </Pressable>
  )
}

const s = StyleSheet.create({
  btn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(10,10,10,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
