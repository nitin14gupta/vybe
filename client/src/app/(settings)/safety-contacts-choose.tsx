import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, UserPlus, Contact as ContactIcon } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, SearchBar, EmptyState } from '@/components/ui'
import { useDeviceContacts, type DeviceContact } from '@/hooks/useDeviceContacts'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { DeviceContactRow } from '@/components/safety/DeviceContactRow'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function ChooseContactScreen() {
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const { contacts, status, canAskAgain, reload, openSettings } = useDeviceContacts()
  const { addContact } = useEmergencyContacts()
  const [query, setQuery] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      : contacts

    const groups = new Map<string, DeviceContact[]>()
    for (const c of filtered) {
      const letter = /[a-z]/i.test(c.name.charAt(0)) ? c.name.charAt(0).toUpperCase() : '#'
      if (!groups.has(letter)) groups.set(letter, [])
      groups.get(letter)!.push(c)
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }))
  }, [contacts, query])

  const handleSelect = async (contact: DeviceContact) => {
    if (addingId) return
    setAddingId(contact.id)
    const created = await addContact({ name: contact.name, phone: contact.phone, source: 'device' })
    setAddingId(null)
    if (created) router.dismissTo('/(settings)/safety-contacts' as any)
  }

  return (
    <View style={s.root}>
      <AppHeader
        title="Choose contact"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
        rightAction={
          <HeaderIconBtn onPress={() => router.push('/(settings)/safety-contacts-new' as any)}>
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
          contentContainerStyle={{ paddingBottom: 32 }}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }) => (
            <Text style={s.sectionHeader}>{section.title === '#' ? '' : section.title}</Text>
          )}
          ListHeaderComponent={<Text style={s.deviceLabel}>Device contacts</Text>}
          renderItem={({ item }) => (
            <View style={{ opacity: addingId && addingId !== item.id ? 0.4 : 1 }}>
              <DeviceContactRow contact={item} onPress={handleSelect} />
            </View>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  searchWrap: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 8 },
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
