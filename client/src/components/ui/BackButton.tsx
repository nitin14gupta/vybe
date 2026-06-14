import { Pressable, StyleSheet } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, ComponentSize, Radius, Spacing } from '@/constants'

interface Props {
  onPress: () => void
}

export function BackButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.btn} hitSlop={8}>
      <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: ComponentSize.backBtn,
    height: ComponentSize.backBtn,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: 4,
    marginLeft: Spacing.screenPadding,
  },
})
