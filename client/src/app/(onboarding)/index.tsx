import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Lock, Cake } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { PrimaryButton, OutlineButton, Screen, GlowLinesBackground } from '@/components/ui'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function AgeGateScreen() {
  const [declined, setDeclined] = useState(false)

  if (declined) {
    return (
      <View style={styles.rootWrap}>
        <GlowLinesBackground />
        <Screen transparent style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={styles.lockEmoji}>
            <Lock size={64} color={Colors.inkSecondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.lockedTitle}>Come back when you're 18!</Text>
          <Text style={styles.lockedBody}>
            Gorave is for adults only. We'll see you on the other side.
          </Text>
          <Pressable onPress={() => { hTap(); setDeclined(false) }}>
            <Text style={styles.goBack}>← Go back</Text>
          </Pressable>
        </Screen>
      </View>
    )
  }

  return (
    <View style={styles.rootWrap}>
      <GlowLinesBackground />
      <Screen transparent style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <View style={styles.emoji}>
          <Cake size={64} color={Colors.brandOrange} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Are you 18 or older?</Text>
        <Text style={styles.body}>
          Gorave is only for adults. You must be 18+ to use this app.
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
    </View>
  )
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: Colors.background },
  emoji: {
    marginBottom: 28,
    alignItems: 'center',
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
    marginBottom: 22,
    alignItems: 'center',
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
    color: Colors.inkSecondary,
  },
})
