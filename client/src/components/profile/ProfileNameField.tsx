import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Input } from '@/components/ui'
import { Colors, FontFamily, Radius } from '@/constants'

interface Props {
  name: string
  setName: (v: string) => void
  nameChangedAt?: string | null
  onLockedPress: (unlockDateLabel: string) => void
}

export function ProfileNameField({ name, setName, nameChangedAt, onLockedPress }: Props) {
  const changedAt = nameChangedAt
    ? new Date(nameChangedAt.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
    : null
  const lockedUntil = changedAt
    ? new Date(changedAt.getTime() + 60 * 24 * 3600 * 1000)
    : null
  const locked = !!lockedUntil && lockedUntil > new Date()
  const lockedUntilLabel = lockedUntil
    ? lockedUntil.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : ''

  return (
    <View style={styles.section}>
      <Text style={styles.label}>NAME</Text>
      {locked ? (
        <Pressable onPress={() => onLockedPress(lockedUntilLabel)} style={styles.lockedField}>
          <Text style={styles.lockedValue}>{name}</Text>
        </Pressable>
      ) : (
        <Input value={name} onChangeText={setName} placeholder="Your name" />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
  },
  lockedField: {
    height: 52,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  lockedValue: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkSecondary,
  },
})
