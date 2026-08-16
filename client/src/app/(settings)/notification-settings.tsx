import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import {
  UserPlus, PartyPopper, CalendarClock, Wallet,
} from 'lucide-react-native'
import { Screen, BackButton } from '@/components/ui'
import ApiService, { type NotificationPrefs } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily, Spacing } from '@/constants'
import { PreferenceToggleRow } from '@/components/settings/PreferenceToggleRow'

const CATEGORIES: { key: keyof NotificationPrefs; icon: any; label: string; description: string }[] = [
  {
    key: 'social',
    icon: UserPlus,
    label: 'Social',
    description: 'New followers, Vibe requests, and Vibe accepts',
  },
  {
    key: 'hosting',
    icon: PartyPopper,
    label: 'Hosting',
    description: "RSVPs, ticket sales, sellouts, and reviews on events you host",
  },
  {
    key: 'attending',
    icon: CalendarClock,
    label: "Events you're going to",
    description: 'Changes, cancellations, and waitlist spots opening up',
  },
  {
    key: 'payments',
    icon: Wallet,
    label: 'Payments',
    description: 'Payment confirmations and wallet refunds',
  },
]

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [loading, setLoading] = useState(true)
  const showPill = usePillStore(s => s.show)

  useFocusEffect(useCallback(() => {
    ApiService.getNotificationPrefs()
      .then(setPrefs)
      .catch(() => {
        setPrefs({ social: true, hosting: true, attending: true, payments: true })
        showPill("Couldn't load your preferences, showing defaults", 'error')
      })
      .finally(() => setLoading(false))
  }, [showPill]))

  const toggle = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs(prev => prev ? { ...prev, [key]: value } : prev)
    ApiService.updateNotificationPrefs({ [key]: value }).catch(() => {
      // Revert on failure
      setPrefs(prev => prev ? { ...prev, [key]: !value } : prev)
      showPill("Couldn't save that change, try again", 'error')
    })
  }

  return (
    <Screen>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>Notification Settings</Text>
        <View style={s.headerEnd} />
      </View>

      {loading || !prefs ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <Text style={s.sectionLabel}>PUSH NOTIFICATIONS</Text>
          <Text style={s.sectionHint}>
            Choose what you get notified about. Turning these off only affects push
            notifications — you'll still see everything in your notifications list.
          </Text>
          <View style={s.card}>
            {CATEGORIES.map((cat, i) => (
              <PreferenceToggleRow
                key={cat.key}
                icon={cat.icon}
                label={cat.label}
                description={cat.description}
                value={prefs[cat.key]}
                onChange={v => toggle(cat.key, v)}
                showSeparator={i < CATEGORIES.length - 1}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.screenPadding,
    paddingBottom: 14,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  headerEnd: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionHint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    lineHeight: 18,
    marginBottom: 14,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
})
