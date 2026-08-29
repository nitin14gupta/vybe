import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'

export interface TabSwitcherItem {
  key: string
  label: string
  /** Optional leading count, rendered bold ahead of the label (e.g. "12 Vibers"). */
  count?: number
  icon?: (isActive: boolean) => React.ReactNode
}

export interface TabSwitcherProps {
  tabs: string[] | TabSwitcherItem[]
  activeTab: string
  onChange: (tab: string) => void
  /** 'pill' (default) — rounded active background, for compact toggles.
   *  'underline' — full-width tabs with an active bottom border, matching the Followers/Following screen. */
  variant?: 'pill' | 'underline'
  /** Whether tabs stretch to fill the row (default true). Set false for a compact,
   *  content-sized toggle placed alongside other buttons (e.g. in a header). */
  fill?: boolean
}

function toItems(tabs: string[] | TabSwitcherItem[]): TabSwitcherItem[] {
  return typeof tabs[0] === 'string'
    ? (tabs as string[]).map(t => ({ key: t, label: t }))
    : (tabs as TabSwitcherItem[])
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function TabButton({ item, isActive, isUnderline, fill, onPress }: {
  item: TabSwitcherItem
  isActive: boolean
  isUnderline: boolean
  fill: boolean
  onPress: () => void
}) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      style={[
        isUnderline ? s.tabUnderline : s.tab,
        !fill && s.tabAuto,
        isActive && (isUnderline ? s.tabUnderlineActive : s.tabActive),
        pressStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { pressScale.value = withSpring(0.95, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
    >
      {item.icon?.(isActive)}
      {item.count != null ? (
        <Text style={[
          isUnderline ? s.tabTextUnderline : s.tabText,
          isActive && (isUnderline ? s.tabTextUnderlineActive : s.tabTextActive),
        ]}>
          <Text style={s.tabCount}>{item.count} </Text>
          {item.label}
        </Text>
      ) : (
        <Text style={[
          isUnderline ? s.tabTextUnderline : s.tabText,
          isActive && (isUnderline ? s.tabTextUnderlineActive : s.tabTextActive),
        ]}>
          {item.label}
        </Text>
      )}
    </AnimatedPressable>
  )
}

export function TabSwitcher({ tabs, activeTab, onChange, variant = 'pill', fill = true }: TabSwitcherProps) {
  const items = toItems(tabs)
  const isUnderline = variant === 'underline'
  return (
    <View style={[isUnderline ? s.containerUnderline : s.container, !fill && s.containerAuto]}>
      {items.map(item => (
        <TabButton
          key={item.key}
          item={item}
          isActive={activeTab === item.key}
          isUnderline={isUnderline}
          fill={fill}
          onPress={() => {
            if (activeTab !== item.key) {
              hTap()
              onChange(item.key)
            }
          }}
        />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
    borderRadius: 12,
    padding: 4,
  },
  containerAuto: {
    alignSelf: 'flex-start',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
  },
  tabAuto: {
    flex: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: Colors.inkPrimary,
  },
  tabText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },

  // Underline variant — matches (profile)/follows.tsx's tab switcher
  containerUnderline: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabUnderline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabUnderlineActive: {
    borderBottomColor: Colors.inkPrimary,
  },
  tabTextUnderline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  tabTextUnderlineActive: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.inkPrimary,
  },
  tabCount: {
    fontFamily: FontFamily.headingBold,
  },
})
