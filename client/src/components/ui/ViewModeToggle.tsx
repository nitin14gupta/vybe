import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { List, LayoutGrid } from 'lucide-react-native'
import { Colors } from '@/constants'
import { hTap } from '@/lib/haptics'
import type { EventViewMode } from '@/store/eventViewModeStore'

export interface ViewModeToggleProps {
  mode: EventViewMode
  onChange: (mode: EventViewMode) => void
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function ModeButton({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <AnimatedPressable
      style={[s.btn, active && s.btnActive, pressStyle]}
      onPress={onPress}
      onPressIn={() => { pressScale.value = withSpring(0.92, { duration: 120 }) }}
      onPressOut={() => { pressScale.value = withSpring(1, { duration: 120 }) }}
      hitSlop={6}
    >
      {children}
    </AnimatedPressable>
  )
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <View style={s.container}>
      <ModeButton active={mode === 'card'} onPress={() => { if (mode !== 'card') { hTap(); onChange('card') } }}>
        <LayoutGrid size={14} color={mode === 'card' ? Colors.background : Colors.inkSecondary} strokeWidth={2} />
      </ModeButton>
      <ModeButton active={mode === 'list'} onPress={() => { if (mode !== 'list') { hTap(); onChange('list') } }}>
        <List size={14} color={mode === 'list' ? Colors.background : Colors.inkSecondary} strokeWidth={2} />
      </ModeButton>
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
