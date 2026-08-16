import { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MapPin, ShieldCheck, Wallet } from 'lucide-react-native'
import { LogoMark } from '@/components/ui'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { InfoRow } from './InfoRow'

function WelcomeStepBase() {
  return (
    <View style={s.content}>
      <LogoMark size={64} style={s.logo} />
      <Text style={s.title}>Become a Gorave host</Text>
      <Text style={s.subtitle}>
        Create events, build your community, and earn — all from the app.
      </Text>

      <View style={s.rows}>
        <InfoRow
          icon={<MapPin size={17} color={Colors.brandOrange} strokeWidth={2} />}
          iconBg={withOpacity(Colors.brandOrange, 0.14)}
          title="Your events get discovered"
          sub="Automatically surfaces in Trending and nearby feeds the moment you publish."
        />
        <InfoRow
          icon={<ShieldCheck size={17} color={Colors.accentGreen} strokeWidth={2} />}
          iconBg={withOpacity(Colors.accentGreen, 0.14)}
          title="Phone-verified guests only"
          sub="Every attendee is identity-verified before they can book your event."
        />
        <InfoRow
          icon={<Wallet size={17} color={Colors.accentGold} strokeWidth={2} />}
          iconBg={withOpacity(Colors.accentGold, 0.14)}
          title="Automatic payouts"
          sub="Revenue lands in your UPI account after each event — no chasing payments."
        />
      </View>
    </View>
  )
}

export const WelcomeStep = memo(WelcomeStepBase)

const s = StyleSheet.create({
  content: { alignItems: 'center' },
  logo: { marginBottom: 20 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 25,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  rows: { width: '100%' },
})
