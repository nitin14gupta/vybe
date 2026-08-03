import { Image, StyleSheet, type ImageSourcePropType } from 'react-native'
import type { ImageStyle, StyleProp } from 'react-native'
import { Logo } from '@/constants'

interface Props {
  size?: number
  opacity?: number
  style?: StyleProp<ImageStyle>
  source?: ImageSourcePropType
}

// One place for "drop the logo mark somewhere small" — headers, empty
// states, splash. Swap the underlying asset in constants/branding.ts and
// every usage updates together. Pass `source` (e.g. LogoBlack) when placing
// it on a light background.
export function LogoMark({ size = 66, opacity = 1, style, source = Logo }: Props) {
  return (
    <Image
      source={source}
      style={[s.img, { width: size, height: size, opacity }, style]}
      resizeMode="contain"
    />
  )
}

const s = StyleSheet.create({
  img: {},
})
