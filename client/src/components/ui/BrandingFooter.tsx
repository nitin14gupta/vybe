import { View, Image, StyleSheet, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native'
import { CraftedByBanner } from '@/constants'

interface Props {
  style?: StyleProp<ViewStyle>
  bannerStyle?: StyleProp<ImageStyle>
}

// "Crafted with love by Gorave" banner — shown at the bottom of Settings and
// About. One place to swap the asset so both stay in sync.
export function BrandingFooter({ style, bannerStyle }: Props) {
  return (
    <View style={[s.wrap, style]}>
      <Image source={CraftedByBanner} style={[s.banner, bannerStyle]} resizeMode="contain" />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center' },
  banner: { width: 220, height: Math.round((220 * 672) / 1568) },
})
