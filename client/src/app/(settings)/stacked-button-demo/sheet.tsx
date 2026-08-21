import { View, Text, StyleSheet, Pressable } from 'react-native'
import React, { useRef } from 'react'
import DrawPad, { DrawPadHandle } from 'expo-drawpad'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StackedButton } from '@/components/stacked-button'
import { RotateCw, Stamp, Undo } from 'lucide-react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { router, Stack } from 'expo-router'
import { Colors, FontFamily, withOpacity } from '@/constants'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function ButtonCluster({ text, icon, color }: { text: string; icon?: React.ReactElement; color: string }) {
  return (
    <View style={styles.btnCluster}>
      {icon}
      <Text style={[styles.btnText, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  )
}

export default function StackedButtonDemoSheet() {
  const { top } = useSafeAreaInsets()
  const currentIndex = useSharedValue(0)
  const padRef = useRef<DrawPadHandle>(null)
  const pathLength = useSharedValue(0)

  const handleCancel = () => {
    if (padRef.current) {
      currentIndex.value = padRef.current.getPaths().length > 0 ? 0 : 1
      router.back()
    }
  }

  const handleReset = () => {
    padRef.current?.erase()
  }

  const handleConfirm = () => {
    router.back()
    currentIndex.value = 2
  }

  const handleUndo = () => {
    if (currentIndex.value === 2) {
      currentIndex.value = 0
      return
    }
    if (padRef.current) {
      padRef.current.undo()
      setTimeout(() => {
        if (pathLength.value === 0) {
          currentIndex.value = 1
        }
      }, 0)
    }
  }

  const undoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(pathLength.value > 0 ? 1 : 0.5),
  }))

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <AnimatedPressable
              onPress={handleUndo}
              style={[styles.headerBtn, undoAnimatedStyle]}
              hitSlop={8}
            >
              <Undo size={22} color={Colors.inkSecondary} strokeWidth={2} />
            </AnimatedPressable>
          ),
        }}
      />
      <View style={[styles.container, { paddingTop: top }]}>
        <View
          style={{ flex: 1 }}
          onTouchStart={() => {
            if (currentIndex.get() === 2) {
              currentIndex.value = 0
            }
          }}
        >
          <DrawPad
            ref={padRef}
            stroke={Colors.inkPrimary}
            strokeWidth={2.5}
            pathLength={pathLength}
            onDrawStart={() => currentIndex.set(0)}
          />
        </View>

        <View style={{ height: 50 }}>
          <StackedButton.Provider
            currentIndex={currentIndex}
            itemStyles={styles.itemStyle}
            gap={12}
            initialIndex={1}
          >
            <StackedButton.Container>
              <StackedButton.Item
                style={styles.resetItem}
                expandedElement={
                  <ButtonCluster text="Cancel" color={Colors.background} />
                }
                expandedStyle={styles.confirmItem}
                onPress={handleCancel}
                handleConfirmation={handleReset}
              >
                <ButtonCluster
                  text="Reset"
                  icon={<RotateCw size={18.5} color={Colors.inkPrimary} strokeWidth={2} />}
                  color={Colors.inkPrimary}
                />
              </StackedButton.Item>
              <StackedButton.Item
                style={styles.confirmItem}
                expandedElement={
                  <ButtonCluster
                    text="Confirm Signature"
                    icon={<Stamp size={18.5} color={Colors.background} strokeWidth={2} />}
                    color={Colors.background}
                  />
                }
                handleConfirmation={() => {}}
                onPress={handleConfirm}
              >
                <ButtonCluster
                  text="Confirm"
                  icon={<Stamp size={18.5} color={Colors.background} strokeWidth={2} />}
                  color={Colors.background}
                />
              </StackedButton.Item>
            </StackedButton.Container>
          </StackedButton.Provider>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 26, gap: 12, backgroundColor: Colors.surface },
  btnCluster: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnText: { fontSize: 15, fontFamily: FontFamily.bodySemiBold },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemStyle: {
    borderRadius: 25,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingVertical: 16,
  },
  resetItem: { flex: 1, backgroundColor: withOpacity(Colors.white, 0.08), borderRadius: 25 },
  confirmItem: { flex: 1, backgroundColor: Colors.inkPrimary, borderRadius: 25 },
})
