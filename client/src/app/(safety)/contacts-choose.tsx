import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, UserPlus, Contact as ContactIcon } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, SearchBar, EmptyState, PrimaryButton } from '@/components/ui'
import { useDeviceContacts, type DeviceContact } from '@/hooks/useDeviceContacts'
import { useEmergencyContacts, normalizePhone } from '@/hooks/useEmergencyContacts'
import { DeviceContactRow } from '@/components/safety/DeviceContactRow'
import { Colors, FontFamily, Spacing } from '@/constants'

const OTHER_SECTION = '#'

export default function ChooseContactScreen() {
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const { contacts, status, canAskAgain, reload, openSettings } = useDeviceContacts()
  const { contacts: emergencyContacts, addContact } = useEmergencyContacts()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<DeviceContact | null>(null)
  const [saving, setSaving] = useState(false)

  const addedNumbers = useMemo(
    () => new Set(emergencyContacts.map(c => normalizePhone(c.phone))),
    [emergencyContacts],
  )

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      : contacts

    const groups = new Map<string, DeviceContact[]>()
    for (const c of filtered) {
      const letter = /[a-z]/i.test(c.name.charAt(0)) ? c.name.charAt(0).toUpperCase() : OTHER_SECTION
      if (!groups.has(letter)) groups.set(letter, [])
      groups.get(letter)!.push(c)
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        if (a === OTHER_SECTION) return 1
        if (b === OTHER_SECTION) return -1
        return a.localeCompare(b)
      })
      .map(([title, data]) => ({ title, data }))
  }, [contacts, query])

  // Tapping a row only toggles local selection — instant, no network round
  // trip — so there's no lag between tap and visual feedback. The add call
  // fires once, from Save.
  const handleToggle = (contact: DeviceContact) => {
    if (addedNumbers.has(normalizePhone(contact.phone))) return
    setSelected(prev => (prev?.id === contact.id ? null : contact))
  }

  const handleSave = async () => {
    if (!selected || saving) return
    setSaving(true)
    const created = await addContact({ name: selected.name, phone: selected.phone, source: 'device' })
    setSaving(false)
    if (created) router.dismissTo('/(safety)/contacts' as any)
  }

  return (
    <View style={s.root}>
      <AppHeader
        title="Choose contact"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
        rightAction={
          <HeaderIconBtn onPress={() => router.push('/(safety)/contacts-new' as any)}>
            <UserPlus size={19} color={Colors.inkPrimary} strokeWidth={2} />
          </HeaderIconBtn>
        }
      />

      <View style={[s.searchWrap, { paddingTop: 4 }]}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search name or number" />
      </View>

      {status === 'loading' ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.inkSecondary} />
        </View>
      ) : status === 'denied' ? (
        <View style={s.center}>
          <EmptyState
            icon={<ContactIcon size={44} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Contacts access needed"
            subtitle="Allow Gorave to read your contacts so you can pick emergency contacts from your phone."
            ctaLabel={canAskAgain ? 'Allow Access' : 'Open Settings'}
            onCtaPress={canAskAgain ? reload : openSettings}
            staticIcon
          />
        </View>
      ) : sections.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>{query ? 'No contacts match your search' : 'No contacts with a phone number found'}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: selected ? 100 : 32 }}
          style={s.list}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={7}
          removeClippedSubviews
          renderSectionHeader={({ section }) => (
            <Text style={s.sectionHeader}>{section.title === OTHER_SECTION ? '' : section.title}</Text>
          )}
          ListHeaderComponent={<Text style={s.deviceLabel}>Device contacts</Text>}
          renderItem={({ item }) => (
            <DeviceContactRow
              contact={item}
              selected={selected?.id === item.id}
              added={addedNumbers.has(normalizePhone(item.phone))}
              onPress={handleToggle}
            />
          )}
        />
      )}

      {selected && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton label="Save" onPress={handleSave} loading={saving} />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  list: { flex: 1 },
  searchWrap: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 8 },
  footer: {
    paddingHorizontal: Spacing.screenPadding, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider,
  },
  deviceLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.88,
    color: Colors.inkSecondary, paddingHorizontal: Spacing.screenPadding, paddingTop: 8, paddingBottom: 4,
  },
  sectionHeader: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkDisabled,
    paddingHorizontal: Spacing.screenPadding, paddingTop: 10, paddingBottom: 2,
  },
  emptyText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
})
