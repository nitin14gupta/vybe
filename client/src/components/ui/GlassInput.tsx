import { useState, useRef, type ReactNode } from 'react'
import { View, Text, TextInput, StyleSheet, type ViewStyle, type TextInputProps } from 'react-native'
import { Colors, FontFamily } from '@/constants'

interface Props {
  label?: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  maxLength?: number
  multiline?: boolean
  error?: string
  disabled?: boolean
  leftIcon?: ReactNode
  autoFocus?: boolean
  style?: ViewStyle
  returnKeyType?: TextInputProps['returnKeyType']
  onSubmitEditing?: () => void
  autoCapitalize?: TextInputProps['autoCapitalize']
}

// Shared "glass" text field — the translucent-white style used over photo
// backdrops/overlays (Create Event, Location search, event search). Distinct
// from the solid Input.tsx used on plain dark-background screens; same idea
// (label, focus ring, error state, char count) but the surface itself needs
// to stay see-through instead of an opaque card.
export function GlassInput({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  multiline,
  error,
  disabled,
  leftIcon,
  autoFocus,
  style,
  returnKeyType,
  onSubmitEditing,
  autoCapitalize,
}: Props) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  return (
    <View style={style}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View
        style={[
          s.wrap,
          multiline && s.wrapMultiline,
          focused && s.wrapFocused,
          !!error && s.wrapError,
        ]}
      >
        {leftIcon}
        <TextInput
          ref={inputRef}
          style={[s.input, multiline && s.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.glassTextDisabled}
          maxLength={maxLength}
          multiline={multiline}
          editable={!disabled}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {maxLength ? <Text style={s.charCount}>{value.length}/{maxLength}</Text> : null}
      </View>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  )
}

const s = StyleSheet.create({
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkPrimary,
    marginBottom: 8,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.glassSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 52,
  },
  wrapMultiline: { alignItems: 'flex-start', paddingTop: 12 },
  // Neutral focus ring — brightens toward white, no brand color, using the
  // "active"/"thick" glass tokens that already existed for this purpose.
  wrapFocused: {
    borderColor: Colors.glassBorderThick,
    backgroundColor: Colors.glassSurfaceActive,
  },
  wrapError: { borderColor: Colors.brandCoral },
  input: {
    flex: 1,
    color: Colors.inkPrimary,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    paddingVertical: 10,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  charCount: {
    color: Colors.glassTextDisabled,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    alignSelf: 'flex-end',
    paddingBottom: 6,
  },
  errorText: {
    color: Colors.brandCoral,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    marginTop: 4,
  },
})
