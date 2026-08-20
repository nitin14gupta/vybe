import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, UserPlus, ShieldAlert } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, EmptyState, ConfirmSheet } from '@/components/ui'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { useEmergencyContacts, MAX_EMERGENCY_CONTACTS } from '@/hooks/useEmergencyContacts'
import { EmergencyContactRow } from '@/components/safety/EmergencyContactRow'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'
import type { EmergencyContact } from '@/types/api'

export default function EmergencyContactsScreen() {
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const { contacts, loading, load, removeContact, maxReached } = useEmergencyContacts()
  const [confirmContact, setConfirmContact] = useState<EmergencyContact | null>(null)

  useFocusEffect(useCallback(() => { load() }, [load]))

  const goAddContact = () => {
    hTap()
    router.push('/(settings)/safety-contacts-choose' as any)
  }

  return (
    <View style={s.root}>
      <AppHeader
        title="Emergency Contacts"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {loading ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <ActivityIndicator color={Colors.inkSecondary} />
        </View>
      ) : contacts.length === 0 ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <EmptyState
            icon={<ShieldAlert size={48} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="No emergency contacts yet"
            subtitle="Add people we can alert with your live location if something feels wrong at an event."
            ctaLabel="Add Contact"
            ctaIcon={<UserPlus size={17} color={Colors.background} strokeWidth={2.2} />}
            onCtaPress={goAddContact}
          />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={c => c.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[s.list, { paddingTop: headerHeight + 8 }]}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListHeaderComponent={
            <>
              <Text style={s.subtitle}>Choose people you want us to alert in case of an emergency.</Text>
              {maxReached ? (
                <Text style={s.maxNote}>Maximum of {MAX_EMERGENCY_CONTACTS} contacts reached</Text>
              ) : (
                <Pressable style={s.addRow} onPress={goAddContact}>
                  <View style={s.addIcon}>
                    <UserPlus size={17} color={Colors.inkPrimary} strokeWidth={2} />
                  </View>
                  <Text style={s.addLabel}>Add contact</Text>
                </Pressable>
              )}
              <View style={s.sep} />
            </>
          }
          renderItem={({ item }) => (
            <EmergencyContactRow contact={item} onDelete={setConfirmContact} />
          )}
        />
      )}

      <ConfirmSheet
        visible={!!confirmContact}
        title="Are you sure?"
        body={`We won't alert ${confirmContact?.name ?? 'this contact'} if there's an emergency.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => { if (confirmContact) removeContact(confirmContact) }}
        onClose={() => setConfirmContact(null)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  list: { paddingBottom: 32 },
  subtitle: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary,
    paddingHorizontal: Spacing.screenPadding, paddingBottom: 14, lineHeight: 19,
  },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: Spacing.screenPadding, height: 56,
  },
  addIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: withOpacity(Colors.accentGreen, 0.14),
    alignItems: 'center', justifyContent: 'center',
  },
  addLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  maxNote: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkDisabled,
    paddingHorizontal: Spacing.screenPadding, paddingBottom: 10,
  },
  sep: { height: 1, backgroundColor: Colors.divider, marginLeft: Spacing.screenPadding },
})
