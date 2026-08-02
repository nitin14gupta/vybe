import { View, Text, StyleSheet } from 'react-native'
import { LogoMark } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'
import { InfoRow } from './InfoRow'

export function WhatToExpectStep() {
  return (
    <View style={s.content}>
      <LogoMark size={64} style={s.logo} />
      <Text style={s.title}>How hosting works</Text>
      <Text style={s.subtitle}>Three things worth knowing before your first event.</Text>

      <View style={s.rows}>
        <InfoRow
          number={1}
          title="You're in charge of your event"
          sub="You're responsible for your venue, guests, and any local rules. Gorave handles bookings and payments."
        />
        <InfoRow
          number={2}
          title="Cancel anytime — up to 48 hours before"
          sub="Attendees get a full wallet refund automatically. After 48 hours, cancellations are blocked."
        />
        <InfoRow
          number={3}
          title="Gorave takes 10%"
          sub="We collect the full ticket price and transfer your 90% after the event. Clear, no surprises."
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  content: { alignItems: 'center' },
  logo: { marginBottom: 20 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  rows: { width: '100%' },
})
