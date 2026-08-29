import { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { ChevronRight } from 'lucide-react-native'
import { hTap, hError } from '@/lib/haptics'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

interface Props {
  icon: ReactNode
  label: string
  value?: string
  onPress: () => void
  destructive?: boolean
  showSeparator?: boolean
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function SettingRow({ icon, label, value, onPress, destructive, showSeparator = true }: Props) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <>
      <AnimatedPressable
        onPress={() => { destructive ? hError() : hTap(); onPress() }}
        onPressIn={() => { pressScale.value = withSpring(0.985, { duration: 120 }) }}
        onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
        style={[styles.row, pressStyle]}
      >
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {!destructive && <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.5} />}
      </AnimatedPressable>
      {showSeparator && <View style={styles.sep} />}
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    height: 56,
    gap: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  destructive: {
    color: Colors.destructive,
  },
  value: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    marginRight: 4,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.screenPadding + 36 + 14,
  },
})
