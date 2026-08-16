import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackButton } from '@/components/ui'
import { Colors, FontFamily, withOpacity } from '@/constants'
import LiquidPlasmaBackground from '@/components/LiquidPlasmaBackground'

export default function BackgroundPreviewScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LiquidPlasmaBackground colors={[Colors.nearBlack, Colors.brandOrange]} vertical />

      <View style={s.topRow}>
        <BackButton transparent onPress={() => router.back()} />
      </View>

      <View style={s.content}>
        <Text style={s.title}>Background</Text>
        <Text style={s.subtitle}>
          Dark → orange, flowing bottom to top.{'\n'}No red in sight.
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nearBlack },
  topRow: { paddingHorizontal: 16 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.inkPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: withOpacity(Colors.inkPrimary, 0.75),
    textAlign: 'center',
    lineHeight: 22,
  },
})
