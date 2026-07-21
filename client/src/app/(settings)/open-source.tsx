import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Screen, AppHeader, HeaderIconBtn } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

const LIBRARIES = [
  'React Native', 'React', 'Expo SDK', 'expo-router', 'expo-audio', 'expo-video',
  'expo-camera', 'expo-location', 'expo-notifications', 'expo-image', 'expo-secure-store',
  'react-native-reanimated', 'react-native-gesture-handler', 'react-native-webview',
  'react-native-maps', 'MapLibre React Native', '@gorhom/bottom-sheet',
  '@shopify/flash-list', 'lucide-react-native', 'zustand', 'FastAPI', 'PostgreSQL',
  'Redis', 'Razorpay SDK', 'Twilio SDK', 'Pillow', 'OpenCV',
]

export default function OpenSourceScreen() {
  return (
    <Screen top={false}>
      <AppHeader
        title="Open Source Licenses"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.body}>
            Gorave is built on top of open source software. We're grateful to the
            maintainers of these projects (used under their respective MIT, Apache-2.0,
            or BSD licenses):
          </Text>
          <View style={styles.list}>
            {LIBRARIES.map(name => (
              <View key={name} style={styles.chip}>
                <Text style={styles.chipText}>{name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footer}>
            Full license texts for each package are available from their respective
            public repositories.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 20, gap: 16 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 21 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.elevated,
  },
  chipText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkPrimary },
  footer: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, lineHeight: 18 },
})
