import type { ReactNode } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Colors, FontFamily, Radius } from '@/constants'

interface Props {
  icon: ReactNode
  title: string
  subtitle?: string
  ctaLabel?: string
  onCtaPress?: () => void
  compact?: boolean
}

export function EmptyState({ icon, title, subtitle, ctaLabel, onCtaPress, compact }: Props) {
  return (
    <View style={[s.wrap, compact && s.wrapCompact]}>
      {icon}
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCtaPress ? (
        <Pressable style={s.cta} onPress={onCtaPress}>
          <Text style={s.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  wrapCompact: { paddingVertical: 24 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, textAlign: 'center' },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
  cta: {
    marginTop: 4,
    backgroundColor: Colors.brandOrange,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  ctaText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: '#111' },
})
