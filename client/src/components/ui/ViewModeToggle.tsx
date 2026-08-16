import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { List, LayoutGrid } from 'lucide-react-native'
import { Colors } from '@/constants'
import { hTap } from '@/lib/haptics'
import type { EventViewMode } from '@/store/eventViewModeStore'

export interface ViewModeToggleProps {
  mode: EventViewMode
  onChange: (mode: EventViewMode) => void
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <View style={s.container}>
      <Pressable
        style={[s.btn, mode === 'card' && s.btnActive]}
        onPress={() => { if (mode !== 'card') { hTap(); onChange('card') } }}
        hitSlop={6}
      >
        <LayoutGrid size={14} color={mode === 'card' ? Colors.background : Colors.inkSecondary} strokeWidth={2} />
      </Pressable>
      <Pressable
        style={[s.btn, mode === 'list' && s.btnActive]}
        onPress={() => { if (mode !== 'list') { hTap(); onChange('list') } }}
        hitSlop={6}
      >
        <List size={14} color={mode === 'list' ? Colors.background : Colors.inkSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  btn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  btnActive: {
    backgroundColor: Colors.inkPrimary,
  },
})
