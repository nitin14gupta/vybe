import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, ComponentSize } from '@/constants'

interface Props {
  label: string
  onPress: () => void
  disabled?: boolean
  style?: ViewStyle
}

export function TextLinkButton({ label, onPress, disabled, style }: Props) {
  return (
    <Pressable
      onPress={!disabled ? () => { hTap(); onPress() } : undefined}
      disabled={disabled}
      style={[styles.btn, style]}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    height: ComponentSize.btnGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkSecondary,
  },
  disabledText: {
    color: Colors.inkDisabled,
  },
})
