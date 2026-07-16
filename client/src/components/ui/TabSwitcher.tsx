import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'

export interface TabSwitcherProps {
  tabs: string[]
  activeTab: string
  onChange: (tab: string) => void
}

export function TabSwitcher({ tabs, activeTab, onChange }: TabSwitcherProps) {
  return (
    <View style={s.container}>
      {tabs.map(tab => {
        const isActive = activeTab === tab
        return (
          <Pressable
            key={tab}
            style={[s.tab, isActive && s.tabActive]}
            onPress={() => {
              if (!isActive) {
                hTap()
                onChange(tab)
              }
            }}
          >
            <Text style={[s.tabText, isActive && s.tabTextActive]}>
              {tab}
            </Text>
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
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.brandOrange,
  },
  tabText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  tabTextActive: {
    color: '#111',
  }
})
