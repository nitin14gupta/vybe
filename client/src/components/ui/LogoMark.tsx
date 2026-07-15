import { Image, StyleSheet } from 'react-native'
import type { ImageStyle, StyleProp } from 'react-native'
import { Logo } from '@/constants'

interface Props {
  size?: number
  opacity?: number
  style?: StyleProp<ImageStyle>
}

// One place for "drop the logo mark somewhere small" — headers, empty
// states, splash. Swap the underlying asset in constants/branding.ts and
// every usage updates together.
export function LogoMark({ size = 24, opacity = 1, style }: Props) {
  return (
    <Image
      source={Logo}
      style={[s.img, { width: size, height: size, opacity }, style]}
      resizeMode="contain"
    />
  )
}

const s = StyleSheet.create({
  img: {},
})
