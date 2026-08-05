import { ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SettingRow } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'

export interface SettingsMenuItem {
  icon: ReactNode
  label: string
  value?: string
  onPress: () => void
}

interface Props {
  title?: string
  items: SettingsMenuItem[]
  style?: object
}

export function SettingsMenuSection({ title, items, style }: Props) {
  return (
    <>
      {title ? <Text style={styles.sectionLabel}>{title}</Text> : null}
      <View style={[styles.card, style]}>
        {items.map((item, i) => (
          <SettingRow
            key={item.label}
            icon={item.icon}
            label={item.label}
            value={item.value}
            onPress={item.onPress}
            showSeparator={i < items.length - 1}
          />
        ))}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
    marginTop: 8,
    marginBottom: 2,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
})
