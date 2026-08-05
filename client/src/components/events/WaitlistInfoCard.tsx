import { StyleSheet, Text, View } from 'react-native'
import { Clock, Users } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export function WaitlistInfoCard() {
  return (
    <View style={s.card}>
      <View style={s.row}>
        <Clock size={15} color={Colors.accentGold} strokeWidth={1.8} />
        <Text style={s.text}>
          You have{' '}
          <Text style={s.highlight}>1 hour</Text>
          {' '}to confirm once a spot opens for you
        </Text>
      </View>
      <View style={s.divider} />
      <View style={s.row}>
        <Users size={15} color={Colors.inkSecondary} strokeWidth={1.8} />
        <Text style={s.text}>
          We'll push-notify you the moment the spot is yours
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.elevated,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: Spacing.md,
    gap: 12,
    marginTop: Spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  text: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    lineHeight: 19,
  },
  highlight: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.accentGold,
  },
  divider: { height: 1, backgroundColor: Colors.divider },
})
