import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn, Input, PhoneInput, PrimaryButton, KeyboardAvoidingWrapper } from '@/components/ui'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function NewEmergencyContactScreen() {
  const insets = useSafeAreaInsets()
  const { addContact } = useEmergencyContacts()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const canSave = firstName.trim().length > 0 && phone.length === 10 && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(undefined)
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const created = await addContact({ name, phone: `+91${phone}`, source: 'manual' })
    setSaving(false)
    if (created) router.dismissTo('/(settings)/safety-contacts' as any)
    else setError('Could not save this contact — try again')
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
          <PhoneInput value={phone} onChangeText={setPhone} error={error} />
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
  footer: {
    paddingHorizontal: Spacing.screenPadding, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider,
  },
})
