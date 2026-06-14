import { useState, ReactNode } from 'react'
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions, ViewStyle } from 'react-native'
import { Colors, FontFamily, ComponentSize, Radius } from '@/constants'

interface Props {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  keyboardType?: KeyboardTypeOptions
  secureTextEntry?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  error?: string
  style?: ViewStyle
  autoFocus?: boolean
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  secureTextEntry,
  leftIcon,
  rightIcon,
  error,
  style,
  autoFocus,
}: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label.toUpperCase()}</Text> : null}
      <View
        style={[
          styles.container,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        {leftIcon}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.inkSecondary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightIcon}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
    marginBottom: 6,
  },
  container: {
    height: ComponentSize.inputHeight,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  focused: {
    borderColor: Colors.brandOrange,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 3,
  },
  errored: {
    borderColor: Colors.brandCoral,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.brandCoral,
    marginTop: 4,
  },
})
