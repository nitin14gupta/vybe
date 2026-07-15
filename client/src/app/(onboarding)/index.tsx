import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { PrimaryButton, OutlineButton, Screen, LogoMark } from '@/components/ui'
import { Colors, FontFamily, Spacing } from '@/constants'
import LiquidPlasmaBackground from '@/components/LiquidPlasmaBackground'

export default function AgeGateScreen() {
  const [declined, setDeclined] = useState(false)

  if (declined) {
    return (
      <Screen transparent style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <LiquidPlasmaBackground />
        <Text style={styles.lockEmoji}>🔒</Text>
        <Text style={styles.lockedTitle}>Come back when you're 18!</Text>
        <Text style={styles.lockedBody}>
          VYBE is for adults only. We'll see you on the other side.
        </Text>
        <Pressable onPress={() => { hTap(); setDeclined(false) }}>
          <Text style={styles.goBack}>← Go back</Text>
        </Pressable>
      </Screen>
    )
  }

  return (
    <Screen transparent style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
      <LiquidPlasmaBackground />
      <LogoMark size={30} opacity={0.9} style={{ marginBottom: 24 }} />
      <Text style={styles.emoji}>🎂</Text>
      <Text style={styles.title}>Are you 18 or older?</Text>
      <Text style={styles.body}>
        VYBE is only for adults. You must be 18+ to use this app.
      </Text>
      <View style={styles.actions}>
        <PrimaryButton
          label="Yes, I'm 18+"
          onPress={() => router.replace('/(onboarding)/profile')}
          style={styles.btn}
        />
        <OutlineButton
          label="No, I'm not"
          onPress={() => setDeclined(true)}
          style={styles.btn}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 80,
    marginBottom: 28,
    textAlign: 'center',
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: Colors.inkPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 22,
    marginBottom: 44,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  btn: {},
  lockEmoji: {
    fontSize: 72,
    marginBottom: 22,
    textAlign: 'center',
    lineHeight: 80,
  },
  lockedTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: Colors.inkPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedBody: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 22,
    marginBottom: 36,
    textAlign: 'center',
  },
  goBack: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.brandOrange,
  },
})
