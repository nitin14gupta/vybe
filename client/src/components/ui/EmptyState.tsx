import { useEffect, type ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated'
import { Colors, FontFamily } from '@/constants'
import { PrimaryButton } from './PrimaryButton'

interface Props {
  icon: ReactNode
  title: string
  subtitle?: string
  ctaLabel?: string
  onCtaPress?: () => void
  compact?: boolean
}

// Gentle, endless up/down drift on the icon — the one change that makes every
// empty state in the app (search, chat, notifications, wallet...) feel alive
// instead of static, without touching each call site.
function FloatingIcon({ children }: { children: ReactNode }) {
  const floatY = useSharedValue(0)

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }))

  return <Animated.View style={style}>{children}</Animated.View>
}

export function EmptyState({ icon, title, subtitle, ctaLabel, onCtaPress, compact }: Props) {
  return (
    <View style={[s.wrap, compact && s.wrapCompact]}>
      <FloatingIcon>{icon}</FloatingIcon>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCtaPress ? (
        <PrimaryButton label={ctaLabel} onPress={onCtaPress} size="small" style={s.cta} />
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  wrapCompact: { paddingVertical: 24 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, textAlign: 'center' },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
  cta: { marginTop: 4 },
})
