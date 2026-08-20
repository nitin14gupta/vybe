import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontFamily } from '@/constants'

// Same neutral initials-fallback convention as EventListCard's hostBadge /
// blocked.tsx's avatarFallback — no per-contact color hashing.
export function ContactAvatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.initial, { fontSize: size * 0.42 }]}>{(name || '?').charAt(0).toUpperCase()}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  avatar: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, color: Colors.inkPrimary },
})
