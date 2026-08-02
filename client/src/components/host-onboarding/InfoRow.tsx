import type { ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontFamily, Radius } from '@/constants'

export function InfoRow({
  icon,
  iconBg,
  number,
  title,
  sub,
}: {
  icon?: ReactNode
  iconBg?: string
  number?: number
  title: string
  sub: string
}) {
  return (
    <View style={s.row}>
      <View style={[s.iconWrap, { backgroundColor: iconBg ?? Colors.elevated }]}>
        {number != null ? <Text style={s.number}>{number}</Text> : icon}
      </View>
      <View style={s.textWrap}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.card,
    marginBottom: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  number: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  textWrap: { flex: 1, gap: 2, paddingTop: 1 },
  title: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: Colors.inkSecondary,
    lineHeight: 18,
  },
})
