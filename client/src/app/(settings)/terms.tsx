import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Screen, AppHeader, HeaderIconBtn } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { TERMS_SECTIONS, LEGAL_UPDATED } from '@/constants/legalContent'

export default function TermsScreen() {
  return (
    <Screen top={false}>
      <AppHeader
        title="Terms of Use"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.updated}>{LEGAL_UPDATED}</Text>
          {TERMS_SECTIONS.map((sec, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <Text style={styles.body}>{sec.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: 20,
    gap: 20,
  },
  updated: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
  },
  section: { gap: 6 },
  sectionTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  body: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 22,
  },
})
