import { useState, useRef } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { Colors, FontFamily, ComponentSize, Radius } from '@/constants'

interface Props {
  value: string
  onChangeText: (text: string) => void
  error?: string
  autoFocus?: boolean
}

export function PhoneInput({ value, onChangeText, error, autoFocus }: Props) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10)
    onChangeText(digits)
  }

  return (
    <View>
      <View
        style={[
          styles.container,
          focused && styles.focused,
          !!error && styles.errored,
        ]}
      >
        <Pressable style={styles.prefix} onPress={() => inputRef.current?.focus()}>
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={styles.code}>+91</Text>
          <ChevronDown size={14} color={Colors.inkSecondary} strokeWidth={2} />
        </Pressable>
        <View style={styles.divider} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder="00000 00000"
          placeholderTextColor={Colors.inkSecondary}
          keyboardType="number-pad"
          maxLength={10}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: ComponentSize.inputPhoneHeight,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.inputLg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
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
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
  },
  flag: {
    fontSize: 18,
  },
  code: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: Colors.divider,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 18,
    letterSpacing: 1.08,
    color: Colors.inkPrimary,
  },
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.brandCoral,
    marginTop: 4,
  },
})
