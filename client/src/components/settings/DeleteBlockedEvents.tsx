import { View, Text, StyleSheet } from 'react-native'
import { Users } from 'lucide-react-native'
import { Colors, FontFamily, Spacing } from '@/constants'
import { PrimaryButton, OutlineButton } from '@/components/ui'

interface Props {
  upcomingEvents: number
  onGoToEvents: () => void
  onBack: () => void
}

export function DeleteBlockedEvents({ upcomingEvents, onGoToEvents, onBack }: Props) {
  return (
    <View style={styles.center}>
      <View style={styles.blockerIconWrap}>
        <Users size={38} color={Colors.brandOrange} strokeWidth={1.8} />
      </View>
      <Text style={styles.blockerTitle}>
        You have {upcomingEvents} upcoming hosted event{upcomingEvents > 1 ? 's' : ''}
      </Text>
      <Text style={styles.blockerBody}>
        You can't delete your account while you have upcoming events as a host. Cancel your events first, then come back.
      </Text>
      <View style={styles.blockerBtns}>
        <PrimaryButton label="Go to My Events" onPress={onGoToEvents} />
        <OutlineButton label="Back" onPress={onBack} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screenPadding, gap: 12 },
  blockerIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  blockerTitle: {
    fontFamily: FontFamily.headingBold, fontSize: 22, letterSpacing: -0.3,
    color: Colors.inkPrimary, textAlign: 'center',
  },
  blockerBody: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 23, marginBottom: 8,
  },
  blockerBtns: { alignSelf: 'stretch', gap: 10 },
})
