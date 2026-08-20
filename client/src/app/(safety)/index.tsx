import { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ArrowLeft, Siren, UserRoundPlus, LifeBuoy } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn } from '@/components/ui'
import { SafetyMenuRow } from '@/components/safety/SafetyMenuRow'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'

export default function SafetyHubScreen() {
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const { contacts, load } = useEmergencyContacts()

  useFocusEffect(useCallback(() => { load() }, [load]))

  const contactsSubtitle = useMemo(
    () => (contacts.length ? contacts.map(c => c.name).join(', ') : "We'll alert them in case of an emergency."),
    [contacts],
  )

  return (
    <View style={s.root}>
      <AppHeader
        title="Gorave Safety"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[s.content, { paddingTop: headerHeight + 8 }]}
      >
        <LinearGradient
          colors={[withOpacity(Colors.accentGreen, 0.16), withOpacity(Colors.accentGreen, 0)]}
          style={s.banner}
        >
          <Siren size={32} color={Colors.accentGreen} strokeWidth={1.6} />
        </LinearGradient>

        <Text style={s.sectionTitle}>Safety preferences</Text>
        <View style={s.card}>
          <SafetyMenuRow
            icon={<UserRoundPlus size={22} color={Colors.inkSecondary} strokeWidth={1.6} />}
            title="Emergency Contacts"
            subtitle={contactsSubtitle}
            onPress={() => router.push('/(safety)/contacts' as any)}
            showSeparator={false}
          />
        </View>

        <Text style={s.sectionTitle}>More safety support</Text>
        <View style={s.card}>
          <SafetyMenuRow
            icon={<LifeBuoy size={22} color={Colors.inkSecondary} strokeWidth={1.6} />}
            title="Help & FAQ"
            subtitle="Get answers or reach support"
            onPress={() => router.push('/(settings)/help' as any)}
            showSeparator={false}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40, gap: 8 },
  banner: {
    height: 110, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.88,
    color: Colors.inkSecondary, marginTop: 12, marginBottom: 2, marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
})
