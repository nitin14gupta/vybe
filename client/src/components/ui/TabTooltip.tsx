import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontFamily } from '@/constants'

interface Props {
  label: string
  visible: boolean
}

// Small label that pops up just above a pressed tab icon (WhatsApp/GPay style),
// rather than a full-width bottom pill.
export function TabTooltip({ label, visible }: Props) {
  if (!visible) return null
  return (
    <View style={s.wrap} pointerEvents="none">
      <View style={s.bubble}>
        <Text style={s.text} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 18,
    zIndex: 50,
  },
  bubble: {
    backgroundColor: Colors.elevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  text: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkPrimary,
  }
})
