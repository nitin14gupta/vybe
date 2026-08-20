import { useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Contact as ContactIcon } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn, Input, PhoneInput, PrimaryButton, KeyboardAvoidingWrapper } from '@/components/ui'
import { useEmergencyContacts, normalizePhone } from '@/hooks/useEmergencyContacts'
import { useDeviceContacts } from '@/hooks/useDeviceContacts'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'

export default function NewEmergencyContactScreen() {
  const insets = useSafeAreaInsets()
  const { contacts: emergencyContacts, addContact } = useEmergencyContacts()
  // Contacts permission is already resolved by the time someone reaches this
  // screen (via the Choose Contact picker) — this just re-reads the cached
  // OS permission decision, no second prompt.
  const { contacts: deviceContacts } = useDeviceContacts()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()

  const normalized = phone.length === 10 ? normalizePhone(`+91${phone}`) : null

  const duplicate = useMemo(
    () => (normalized ? emergencyContacts.find(c => normalizePhone(c.phone) === normalized) : undefined),
    [emergencyContacts, normalized],
  )
  const deviceMatch = useMemo(
    () => (normalized && !duplicate ? deviceContacts.find(c => normalizePhone(c.phone) === normalized) : undefined),
    [deviceContacts, normalized, duplicate],
  )

  const phoneError = duplicate ? 'This number is already an emergency contact' : saveError
  const canSave = firstName.trim().length > 0 && phone.length === 10 && !saving && !duplicate

  const useDeviceName = () => {
    if (!deviceMatch) return
    hTap()
    const [first, ...rest] = deviceMatch.name.trim().split(/\s+/)
    setFirstName(first ?? '')
    setLastName(rest.join(' '))
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setSaveError(undefined)
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const created = await addContact({ name, phone: `+91${phone}`, source: 'manual' })
    setSaving(false)
    if (created) router.dismissTo('/(safety)/contacts' as any)
    else setSaveError('Could not save this contact — try again')
  }

  return (
    <View style={s.root}>
      <AppHeader
        title="New Contact"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <KeyboardAvoidingWrapper>
        <View style={s.content}>
          <Text style={s.caption}>This contact won't be saved in your device's address book.</Text>

          <Input label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" autoCapitalize="words" style={s.field} />
          <Input label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name" autoCapitalize="words" style={s.field} />

          <Text style={s.label}>PHONE NUMBER</Text>
          <PhoneInput value={phone} onChangeText={setPhone} error={phoneError} />

          {deviceMatch && (
            <Pressable style={s.suggestion} onPress={useDeviceName}>
              <ContactIcon size={15} color={Colors.inkSecondary} strokeWidth={2} />
              <Text style={s.suggestionText}>
                Saved as <Text style={s.suggestionName}>{deviceMatch.name}</Text> in your contacts — tap to use that name
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingWrapper>

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton label="Save" onPress={handleSave} disabled={!canSave} loading={saving} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 8, gap: 4 },
  caption: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary,
    lineHeight: 19, marginBottom: 20,
  },
  field: { marginBottom: 18 },
  label: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.88,
    color: Colors.inkSecondary, marginBottom: 6,
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, padding: 12, borderRadius: 12,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
  },
  suggestionText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary, lineHeight: 17 },
  suggestionName: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
  footer: {
    paddingHorizontal: Spacing.screenPadding, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider,
  },
})
