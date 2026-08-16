import { View, Text, StyleSheet } from 'react-native'
import {
  Trash2, ShieldOff, Wallet, Calendar, MessageCircle,
} from 'lucide-react-native'
import { Colors, FontFamily, Radius, withOpacity } from '@/constants'
import { PrimaryButton, OutlineButton } from '@/components/ui'

const LOSSES = [
  { icon: Calendar,       text: 'All your event bookings and tickets' },
  { icon: Wallet,         text: 'Any remaining Gorave Wallet credits' },
  { icon: MessageCircle,  text: 'All conversations and connections' },
  { icon: ShieldOff,      text: 'Your profile, photos and voice intro' },
]

interface Props {
  onContinue: () => void
  onCancel: () => void
}

export function DeleteLossStep({ onContinue, onCancel }: Props) {
  return (
    <>
      <View style={styles.iconCircle}>
        <Trash2 size={36} color={Colors.brandCoral} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>What you'll lose</Text>
      <Text style={styles.body}>
        Everything linked to your account will be permanently deleted:
      </Text>

      <View style={styles.lossCard}>
        {LOSSES.map(({ icon: Icon, text }, i) => (
          <View key={i} style={[styles.lossRow, i < LOSSES.length - 1 && styles.lossBorder]}>
            <View style={styles.lossIcon}>
              <Icon size={16} color={Colors.brandCoral} strokeWidth={1.8} />
            </View>
            <Text style={styles.lossText}>{text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.spacer} />

      <PrimaryButton label="I understand, continue" onPress={onContinue} />
      <OutlineButton label="Keep My Account" onPress={onCancel} style={styles.secondaryBtn} />
    </>
  )
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: withOpacity(Colors.brandCoral, 0.1),
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  title: {
    fontFamily: FontFamily.headingBold, fontSize: 26, letterSpacing: -0.5,
    color: Colors.inkPrimary, textAlign: 'center', marginBottom: 14,
  },
  body: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 23, marginBottom: 8,
  },
  spacer: { height: 24 },
  secondaryBtn: { marginTop: 10 },

  lossCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.divider,
    overflow: 'hidden', marginTop: 8,
  },
  lossRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  lossBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  lossIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: withOpacity(Colors.brandCoral, 0.1),
    alignItems: 'center', justifyContent: 'center',
  },
  lossText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, flex: 1 },
})
