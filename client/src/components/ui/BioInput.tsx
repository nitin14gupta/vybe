import { useState, useRef } from 'react'
import { TextInput, Pressable, Text, StyleSheet } from 'react-native'
import { Colors, FontFamily, Radius } from '@/constants'
import { usePillStore } from '@/store/pillStore'

interface BioInputProps {
  value: string
  onChangeText: (text: string) => void
}

export function BioInput({ value, onChangeText }: BioInputProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const showPill = usePillStore(s => s.show)

  const handleChange = (v: string) => {
    const lines = v.split('\n')
    if (lines.length > 5) {
      showPill('Maximum 5 lines allowed', 'default')
      return
    }
    if (v.length > 150) {
      showPill('Maximum 150 characters allowed', 'default')
      return
    }
    onChangeText(v)
  }

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={[styles.wrap, focused && styles.focused]}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        placeholder="A short intro — who are you?"
        placeholderTextColor={Colors.inkDisabled}
        multiline
        textAlignVertical="top"
        style={styles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        showSoftInputOnFocus
      />
      <Text style={styles.counter}>{value.length}/150</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    padding: 14,
    minHeight: 90,
  },
  focused: {
    borderColor: Colors.inkSecondary,
    shadowColor: Colors.inkSecondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
  },
  input: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 22,
    minHeight: 60,
  },
  counter: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    textAlign: 'right',
    marginTop: 6,
  },
})
