import { useEffect, type ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, useDerivedValue,
  withTiming, interpolateColor, runOnJS, Easing, type SharedValue,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'

const { width: SCREEN_W } = Dimensions.get('window')
const SETTLE_MS = 260
const FLICK_VELOCITY = 500

export interface SwipeTabItem {
  key: string
  label: string
  /** Optional leading count, rendered bold ahead of the label (e.g. "12 Vibers"). */
  count?: number
}

interface Props {
  tabs: SwipeTabItem[]
  activeTab: string
  onChange: (key: string) => void
  /** One pane per tab, same order as `tabs`. All panes stay mounted so the drag can reveal them live. */
  children: ReactNode[]
}

export function SwipeableTabs({ tabs, activeTab, onChange, children }: Props) {
  const n = tabs.length
  const index = Math.max(0, tabs.findIndex(t => t.key === activeTab))

  const translateX = useSharedValue(-index * SCREEN_W)
  // Mirrors `index` on the UI thread — plain refs aren't safe to read inside
  // worklets, shared values are the codebase's established pattern for that
  // (see TemplateFan.tsx).
  const activeIndex = useSharedValue(index)

  useEffect(() => {
    activeIndex.value = index
    translateX.value = withTiming(-index * SCREEN_W, { duration: SETTLE_MS, easing: Easing.out(Easing.cubic) })
  }, [index])

  const commit = (i: number) => onChange(tabs[i].key)

  const pan = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .failOffsetY([-10, 10])
    .onUpdate(e => {
      const base = -activeIndex.value * SCREEN_W
      const min = -(n - 1) * SCREEN_W
      translateX.value = Math.min(0, Math.max(min, base + e.translationX))
    })
    .onEnd(e => {
      const raw = -translateX.value / SCREEN_W
      let target = Math.round(raw)
      if (target === activeIndex.value) {
        if (e.velocityX < -FLICK_VELOCITY) target += 1
        else if (e.velocityX > FLICK_VELOCITY) target -= 1
      }
      target = Math.min(n - 1, Math.max(0, target))
      translateX.value = withTiming(-target * SCREEN_W, { duration: SETTLE_MS, easing: Easing.out(Easing.cubic) })
      if (target !== activeIndex.value) runOnJS(commit)(target)
    })

  const progress = useDerivedValue(() => -translateX.value / SCREEN_W)

  const pagerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))

  const tabWidth = SCREEN_W / n
  const underlineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * tabWidth }] }))

  return (
    <View style={s.root}>
      <View style={s.header}>
        {tabs.map((tab, i) => (
          <Pressable
            key={tab.key}
            style={s.tabBtn}
            onPress={() => { if (i !== index) { hTap(); onChange(tab.key) } }}
          >
            <TabLabel tab={tab} index={i} progress={progress} />
          </Pressable>
        ))}
        <Animated.View style={[s.underline, { width: tabWidth }, underlineStyle]} />
      </View>

      <GestureDetector gesture={pan}>
        <View style={s.viewport}>
          <Animated.View style={[s.pager, { width: SCREEN_W * n }, pagerStyle]}>
            {children.map((child, i) => (
              <View key={tabs[i]?.key ?? i} style={{ width: SCREEN_W }}>
                {child}
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  )
}

function TabLabel({ tab, index, progress }: { tab: SwipeTabItem; index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [index - 1, index, index + 1],
      [Colors.inkSecondary, Colors.inkPrimary, Colors.inkSecondary],
    ),
  }))
  return (
    <Animated.Text style={[s.tabText, style]}>
      {tab.count != null ? <Text style={s.tabCount}>{tab.count} </Text> : null}
      {tab.label}
    </Animated.Text>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 11 },
  tabText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15 },
  tabCount: { fontFamily: FontFamily.headingBold },
  underline: {
    position: 'absolute', left: 0, bottom: 0, height: 2,
    backgroundColor: Colors.inkPrimary,
  },

  viewport: { flex: 1, overflow: 'hidden' },
  pager: { flex: 1, flexDirection: 'row' },
})
