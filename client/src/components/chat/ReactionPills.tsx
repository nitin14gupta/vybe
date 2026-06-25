import { View, Text, Pressable, StyleSheet } from 'react-native'
import { hSelection } from '@/lib/haptics'
import { FontFamily } from '@/constants'

interface Props {
  reactions: Record<string, string> | null
  myId: string
  onPillPress: (emoji: string) => void
}

export function ReactionPills({ reactions, myId, onPillPress }: Props) {
  if (!reactions || Object.keys(reactions).length === 0) return null

  // group: emoji → { count, iMine }
  const groups: Record<string, { count: number; iMine: boolean }> = {}
  for (const [uid, emoji] of Object.entries(reactions)) {
    if (!groups[emoji]) groups[emoji] = { count: 0, iMine: false }
    groups[emoji].count++
    if (uid === myId) groups[emoji].iMine = true
  }

  return (
    <View style={s.row}>
      {Object.entries(groups).map(([emoji, { count, iMine }]) => (
        <Pressable
          key={emoji}
          style={[s.pill, iMine && s.pillMine]}
          onPress={() => { hSelection(); onPillPress(emoji) }}
          hitSlop={4}
        >
          <Text style={s.emoji}>{emoji}</Text>
          {count > 1 && <Text style={[s.count, iMine && s.countMine]}>{count}</Text>}
        </Pressable>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
    marginTop: -11,
    zIndex: 2,
    elevation: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 2,
  },
  pillMine: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: 'rgba(255,107,53,0.4)',
  },
  emoji: { fontSize: 14 },
  count: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  countMine: { color: 'rgba(255,107,53,0.9)' },
})
