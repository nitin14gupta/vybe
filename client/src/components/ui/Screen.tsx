import { ReactNode } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/constants'

interface Props {
  children: ReactNode
  style?: ViewStyle
  /** Apply top safe-area padding. Default true. Pass false for full-bleed top images. */
  top?: boolean
  /** Apply bottom safe-area padding. Default true. */
  bottom?: boolean
}

export function Screen({ children, style, top = true, bottom = true }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        styles.base,
        top && { paddingTop: insets.top },
        bottom && { paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: Colors.background },
})
