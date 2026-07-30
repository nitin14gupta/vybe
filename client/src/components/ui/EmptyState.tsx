import type { ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
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

export function EmptyState({ icon, title, subtitle, ctaLabel, onCtaPress, compact }: Props) {
  return (
    <View style={[s.wrap, compact && s.wrapCompact]}>
      {icon}
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
