import { View, Text, StyleSheet } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { Colors, FontFamily, SUPPORT_EMAIL, withOpacity } from '@/constants'
import { PrimaryButton, OutlineButton } from '@/components/ui'

interface Props {
  onContinue: () => void
  onCancel: () => void
}

export function DeleteWarningStep({ onContinue, onCancel }: Props) {
  return (
    <>
      <View style={styles.iconCircle}>
        <AlertTriangle size={36} color={Colors.brandCoral} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Are you sure?</Text>
      <Text style={styles.body}>
        Deleting your account is permanent. Your profile, photos, events, and Gorave Wallet credits will be removed within 30 days.
      </Text>
      <Text style={styles.bodySecond}>
        If you change your mind within 30 days, contact{' '}
        <Text style={styles.link}>{SUPPORT_EMAIL}</Text>
        {' '}with your registered phone number and we'll restore your account.
      </Text>

      <View style={styles.spacer} />

      <PrimaryButton label="Continue" onPress={onContinue} />
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
  bodySecond: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkDisabled,
    textAlign: 'center', lineHeight: 21,
  },
  link: { color: Colors.brandOrange, fontFamily: FontFamily.bodyMedium },
  spacer: { height: 24 },
  secondaryBtn: { marginTop: 10 },
})
