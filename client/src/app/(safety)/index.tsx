import { useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ShieldCheck, Users, LifeBuoy, MapPin } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn } from '@/components/ui'
import { SettingsMenuSection } from '@/components/settings/SettingsMenuSection'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { useEmergencyContacts, MAX_EMERGENCY_CONTACTS } from '@/hooks/useEmergencyContacts'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'

const iconColor = Colors.inkSecondary

export default function SafetyHubScreen() {
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const { contacts, load } = useEmergencyContacts()

  useFocusEffect(useCallback(() => { load() }, [load]))

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
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <ShieldCheck size={26} color={Colors.accentGreen} strokeWidth={2} />
          </View>
          <Text style={s.heroTitle}>Your safety net</Text>
          <Text style={s.heroBody}>
            Add the people we should reach out to, and share your live location with, the moment you hit SOS at an event.
          </Text>
        </View>

        <SettingsMenuSection
          title="SETUP"
          items={[
            {
              icon: <Users size={18} color={iconColor} strokeWidth={1.5} />,
              label: 'Emergency Contacts',
              value: contacts.length ? `${contacts.length}/${MAX_EMERGENCY_CONTACTS}` : 'Add contacts',
              onPress: () => router.push('/(safety)/contacts' as any),
            },
          ]}
        />

        <View style={s.infoRow}>
          <View style={s.infoIcon}>
            <LifeBuoy size={16} color={Colors.inkSecondary} strokeWidth={1.8} />
          </View>
          <Text style={s.infoText}>
            SOS alerts and live location sharing from the event screen are on the way — your emergency contacts will be ready for it.
          </Text>
        </View>
        <View style={s.infoRow}>
          <View style={s.infoIcon}>
            <MapPin size={16} color={Colors.inkSecondary} strokeWidth={1.8} />
          </View>
          <Text style={s.infoText}>
            We only ever use this info to alert the people you've chosen — never for marketing or shared with anyone else.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40, gap: 8 },
  hero: {
    alignItems: 'center', gap: 8,
    paddingVertical: 20, paddingHorizontal: 16,
    marginBottom: 4,
  },
  heroIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: withOpacity(Colors.accentGreen, 0.12),
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontFamily: FontFamily.headingBold, fontSize: 19, color: Colors.inkPrimary },
  heroBody: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13.5, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 20, maxWidth: 300,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 4, paddingTop: 14,
  },
  infoIcon: {
    width: 28, height: 28, borderRadius: 14, marginTop: 1,
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: {
    flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary,
    lineHeight: 18,
  },
})
