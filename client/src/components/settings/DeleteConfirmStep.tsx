import { View, Text, TextInput, ActivityIndicator, StyleSheet } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { OutlineButton } from '@/components/ui'

interface Props {
  typed: string
  onTypedChange: (v: string) => void
  deleting: boolean
  onDelete: () => void
  onCancel: () => void
}

export function DeleteConfirmStep({ typed, onTypedChange, deleting, onDelete, onCancel }: Props) {
  return (
    <>
      <View style={[styles.iconCircle, styles.iconCircleRed]}>
        <Trash2 size={36} color={Colors.destructive} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Final step</Text>
      <Text style={styles.body}>
        Type <Text style={styles.deleteWord}>DELETE</Text> below to permanently delete your account. This cannot be undone.
      </Text>

      <TextInput
        style={styles.typeInput}
        value={typed}
        onChangeText={v => onTypedChange(v.toUpperCase())}
        placeholder="Type DELETE here"
        placeholderTextColor={Colors.inkDisabled}
        autoCapitalize="characters"
        maxLength={6}
        editable={!deleting}
      />

      <View style={styles.finalDeleteBtn}>
        {deleting ? (
          <ActivityIndicator color={Colors.inkPrimary} />
        ) : (
          <OutlineButton
            label="Delete My Account"
            onPress={onDelete}
            disabled={typed !== 'DELETE'}
            style={styles.destructiveOutline}
          />
        )}
      </View>

      <OutlineButton label="Cancel" onPress={onCancel} style={styles.secondaryBtn} disabled={deleting} />
    </>
  )
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: withOpacity(Colors.destructive, 0.1),
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  iconCircleRed: { backgroundColor: withOpacity(Colors.destructive, 0.15) },
  title: {
    fontFamily: FontFamily.headingBold, fontSize: 26, letterSpacing: -0.5,
    color: Colors.inkPrimary, textAlign: 'center', marginBottom: 14,
  },
  body: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 23, marginBottom: 8,
  },
  deleteWord: { fontFamily: FontFamily.headingBold, color: Colors.destructive },
  secondaryBtn: { marginTop: 10 },

  typeInput: {
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1,
    borderColor: withOpacity(Colors.destructive, 0.4), paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.destructive,
    textAlign: 'center', letterSpacing: 4, marginBottom: 16, marginTop: 8,
  },

  finalDeleteBtn: { marginBottom: 4 },
  destructiveOutline: {
    borderColor: withOpacity(Colors.destructive, 0.5),
  },
})
