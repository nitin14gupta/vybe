import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Colors, FontFamily } from '@/constants'
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

export function TabSwitcher({ tabs, activeTab, onChange, variant = 'pill', fill = true }: TabSwitcherProps) {
  const items = toItems(tabs)
  const isUnderline = variant === 'underline'
  return (
    <View style={[isUnderline ? s.containerUnderline : s.container, !fill && s.containerAuto]}>
      {items.map(item => {
        const isActive = activeTab === item.key
        return (
          <Pressable
            key={item.key}
            style={[
              isUnderline ? s.tabUnderline : s.tab,
              !fill && s.tabAuto,
              isActive && (isUnderline ? s.tabUnderlineActive : s.tabActive),
            ]}
            onPress={() => {
              if (!isActive) {
                hTap()
                onChange(item.key)
              }
            }}
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
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: '#111',
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
