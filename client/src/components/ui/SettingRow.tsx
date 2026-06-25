import { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
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

export function SettingRow({ icon, label, value, onPress, destructive, showSeparator = true }: Props) {
  return (
    <>
      <Pressable onPress={() => { destructive ? hError() : hTap(); onPress() }} style={styles.row}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {!destructive && <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.5} />}
      </Pressable>
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
    color: Colors.brandCoral,
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
