import { useState } from 'react'
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { router } from 'expo-router'
import { Siren } from 'lucide-react-native'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { SafetyMenuRow } from '@/components/safety/SafetyMenuRow'
import { useSos } from '@/hooks/useSos'
import { useHasEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { useLocationStore } from '@/store/locationStore'
import { hTap } from '@/lib/haptics'
import { Colors } from '@/constants'

function useSosFlow(eventId: string) {
  const { sendSos } = useSos(eventId)
  const hasEmergencyContacts = useHasEmergencyContacts()
  const [sosOpen, setSosOpen] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)

  const open = () => {
    hTap()
    if (hasEmergencyContacts) {
      useLocationStore.getState()._start()
      setSosOpen(true)
    } else {
      setSetupOpen(true)
    }
  }

  const sheets = (
    <>
      <ConfirmSheet
        visible={sosOpen}
        title="Need help?"
        body="This will send an SMS to your emergency contacts with your current location and a message that you may need assistance."
        confirmLabel="Send SOS"
        destructive
        onConfirm={sendSos}
        onClose={() => setSosOpen(false)}
      />
      <ConfirmSheet
        visible={setupOpen}
        title="Add an emergency contact first"
        body="SOS alerts your emergency contacts with your location — add at least one before you can send it."
        confirmLabel="Add Contact"
        onConfirm={() => router.push('/(safety)/contacts' as any)}
        onClose={() => setSetupOpen(false)}
      />
    </>
  )

  return { open, sheets }
}

// Compact icon-only trigger — a thumb-corner badge on list/card rows.
export function SosButton({ eventId, size = 13, style }: { eventId: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const { open, sheets } = useSosFlow(eventId)
  return (
    <>
      <Pressable style={[s.badge, style]} onPress={open} hitSlop={6}>
        <Siren size={size} color={Colors.destructive} strokeWidth={2.4} />
      </Pressable>
      {sheets}
    </>
  )
}

// Full icon + title + subtitle + chevron row — the event detail Safety
// section's SOS entry.
export function SosRow({ eventId }: { eventId: string }) {
  const { open, sheets } = useSosFlow(eventId)
  return (
    <>
      <SafetyMenuRow
        icon={<Siren size={20} color={Colors.destructive} strokeWidth={1.6} />}
        title="Emergency SOS"
        subtitle="Get help quickly"
        onPress={open}
        showSeparator={false}
      />
      {sheets}
    </>
  )
}

const s = StyleSheet.create({
  badge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(10,10,10,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
})
