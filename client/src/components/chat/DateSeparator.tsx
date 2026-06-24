import { View, Text, StyleSheet } from 'react-native'
import { FontFamily } from '@/constants'

export function DateSeparator({ label }: { label: string }) {
  return (
    <View style={s.wrap}>
      <View style={s.line} />
      <Text style={s.label}>{label}</Text>
      <View style={s.line} />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, marginHorizontal: 16 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)' },
  label: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
})
