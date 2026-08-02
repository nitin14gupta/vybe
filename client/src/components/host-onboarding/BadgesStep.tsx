import { View, Text, StyleSheet } from 'react-native'
import { LogoMark } from '@/components/ui'
import { Colors, FontFamily, Radius } from '@/constants'
import { BadgeLadder } from './BadgeLadder'

export function BadgesStep() {
  return (
    <View style={s.content}>
      <LogoMark size={64} style={s.logo} />
      <Text style={s.title}>Your reputation grows with you</Text>
      <Text style={s.subtitle}>
        Host more events, earn a higher badge. Guests can see your tier before they book.
      </Text>

      <BadgeLadder />

      <View style={s.statRow}>
        <View style={s.statPill}>
          <Text style={s.statNum}>2×</Text>
          <Text style={s.statLabel}>more bookings for Elite+ hosts</Text>
        </View>
        <View style={s.statPill}>
          <Text style={s.statNum}>Free</Text>
          <Text style={s.statLabel}>2 free events per month</Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  content: { width: '100%', alignItems: 'center' },
  logo: { marginBottom: 20 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 20, width: '100%' },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.card,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statNum: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
  },
  statLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
})
