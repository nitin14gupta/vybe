import { Image, StyleSheet, View } from 'react-native'

export function GlowLinesBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require('../../../assets/glow-bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  )
}
