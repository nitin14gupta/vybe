import { memo, type ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { ChevronRight } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Spacing } from '@/constants'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Icon + title + one-line subtitle + chevron — richer than the plain
// label/value SettingRow, so a row can show live state (contact names) in
// place of its static description once there's something to show.
export const SafetyMenuRow = memo(function SafetyMenuRow({
  icon,
  title,
  subtitle,
  onPress,
  showSeparator = true,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  onPress: () => void
  showSeparator?: boolean
}) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <>
      <AnimatedPressable
        style={[s.row, pressStyle]}
        onPress={() => { hTap(); onPress() }}
        onPressIn={() => { pressScale.value = withSpring(0.985, { duration: 120 }) }}
        onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
      >
        <View style={s.iconWrap}>{icon}</View>
        <View style={s.textWrap}>
          <Text style={s.title}>{title}</Text>
          {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
      </AnimatedPressable>
      {showSeparator && <View style={s.sep} />}
    </>
  )
})

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: 14, gap: 14,
  },
  iconWrap: { width: 24, alignItems: 'center' },
  textWrap: { flex: 1, gap: 2 },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 15.5, color: Colors.inkPrimary },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary },
  sep: { height: 1, backgroundColor: Colors.divider, marginLeft: Spacing.screenPadding + 24 + 14 },
})
