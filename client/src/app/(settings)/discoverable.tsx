import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Eye, EyeOff } from 'lucide-react-native'
import { Screen, BackButton } from '@/components/ui'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hSelection } from '@/lib/haptics'

export default function DiscoverableScreen() {
  const insets   = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)

  const [discoverable, setDiscoverable] = useState(true)
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)

  useEffect(() => {
    ApiService.getMe()
      .then(profile => {
        setDiscoverable(profile.discoverable ?? true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (value: boolean) => {
    hSelection()
    setDiscoverable(value)
    setSaving(true)
    try {
      await ApiService.setDiscoverable(value)
    } catch {
      setDiscoverable(!value)
      showPill('Could not update setting. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <View style={s.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={s.title}>Show in Discover</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.content}>
        <View style={s.iconCircle}>
          {discoverable
            ? <Eye size={32} color={Colors.brandOrange} strokeWidth={1.8} />
            : <EyeOff size={32} color={Colors.inkDisabled} strokeWidth={1.8} />
          }
        </View>

        <Text style={s.heading}>
          {discoverable ? 'You\'re visible in Discover' : 'You\'re hidden from Discover'}
        </Text>
        <Text style={s.sub}>
          {discoverable
            ? 'Other Vybe users near you can find your profile in the Discover tab.'
            : 'Your profile won\'t appear in Discover. You can still follow people, attend events, and chat with existing connections.'
          }
        </Text>

        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Show me in Discover</Text>
              <Text style={s.rowSub}>
                {loading ? 'Loading…' : discoverable ? 'On — visible to nearby users' : 'Off — hidden from Discover'}
              </Text>
            </View>
            {loading
              ? <ActivityIndicator color={Colors.brandOrange} />
              : (
                <Switch
                  value={discoverable}
                  onValueChange={toggle}
                  disabled={saving}
                  trackColor={{ false: Colors.divider, true: Colors.brandOrange }}
                  thumbColor="#fff"
                />
              )
            }
          </View>
        </View>

        <Text style={s.note}>
          This only affects whether your profile card appears in others' Discover feed. It doesn't affect events, chats, or profile links.
        </Text>
      </View>
    </Screen>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingRight: Spacing.screenPadding, paddingBottom: 8,
  },
  title: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary,
  },
  content: { flex: 1, paddingHorizontal: Spacing.screenPadding, paddingTop: 16 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  heading: {
    fontFamily: FontFamily.headingBold, fontSize: 22, letterSpacing: -0.3,
    color: Colors.inkPrimary, textAlign: 'center', marginBottom: 10,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 21, marginBottom: 28,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.card,
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },
  note: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled,
    lineHeight: 18, textAlign: 'center',
  },
})
