import { Pressable, StyleSheet } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, ComponentSize, Radius, Spacing } from '@/constants'

interface Props {
  onPress: () => void
  transparent?: boolean
}

export function BackButton({ onPress, transparent = false }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, transparent && styles.transparentBtn]} hitSlop={8}>
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
  transparentBtn: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
})
