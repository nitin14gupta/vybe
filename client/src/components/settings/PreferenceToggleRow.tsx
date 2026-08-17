import { View, Text, StyleSheet, Switch } from 'react-native'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export function PreferenceToggleRow({ icon: Icon, label, description, value, onChange, showSeparator }: {
  icon: any
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  showSeparator: boolean
}) {
  return (
    <>
      <View style={s.row}>
        <View style={s.iconWrap}>
          <Icon size={18} color={Colors.inkSecondary} strokeWidth={1.5} />
        </View>
        <View style={s.textBlock}>
          <Text style={s.label}>{label}</Text>
          <Text style={s.description}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={v => { hSelection(); onChange(v) }}
          trackColor={{ false: Colors.divider, true: Colors.brandOrange }}
          thumbColor={Colors.inkPrimary}
        />
      </View>
      {showSeparator && <View style={s.sep} />}
    </>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 14,
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
  textBlock: { flex: 1, gap: 2 },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  description: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    lineHeight: 16,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.screenPadding + 36 + 14,
  },
})
