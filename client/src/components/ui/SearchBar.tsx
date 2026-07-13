import type { ReactNode } from 'react'
import { View, TextInput, Pressable, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { Search, X } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

interface Props {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  /** 'solid' matches dark screens (Chat, Search), 'glass' matches translucent overlays (modals over maps/photos) */
  variant?: 'solid' | 'glass'
  autoFocus?: boolean
  focused?: boolean
  onFocus?: () => void
  onBlur?: () => void
  onSubmitEditing?: () => void
  /** Extra control rendered after the clear button, e.g. a filter toggle */
  rightSlot?: ReactNode
  style?: StyleProp<ViewStyle>
}

export function SearchBar({
  value, onChangeText, placeholder, variant = 'solid',
  autoFocus, focused, onFocus, onBlur, onSubmitEditing, rightSlot, style,
}: Props) {
  const isGlass = variant === 'glass'
  const iconColor = isGlass ? Colors.glassTextDisabled : Colors.inkDisabled

  return (
    <View
      style={[
        s.wrap,
        isGlass ? s.wrapGlass : s.wrapSolid,
        !isGlass && focused && s.wrapSolidFocused,
        style,
      ]}
    >
      <Search size={16} color={iconColor} strokeWidth={1.8} />
      <TextInput
        style={[s.input, isGlass && s.inputGlass]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={iconColor}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
      />
      {value.length > 0 && (
        <Pressable onPress={() => { hTap(); onChangeText('') }} hitSlop={8}>
          <X size={16} color={iconColor} strokeWidth={2} />
        </Pressable>
      )}
      {rightSlot}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  wrapSolid: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  wrapSolidFocused: {
    borderColor: Colors.brandOrange + '55',
  },
  wrapGlass: {
    backgroundColor: Colors.glassSurface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  inputGlass: {
    color: '#fff',
    paddingVertical: 10,
  },
})
