import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReactNode } from 'react'
import { Colors, FontFamily } from '@/constants'
import { LogoMark } from './LogoMark'

export const APP_HEADER_BAR_HEIGHT = 52

interface Props {
  showLogo?: boolean
  title?: string
  leftAction?: ReactNode
  rightAction?: ReactNode
  transparent?: boolean
  // Pass the `hideProgress` from useHeaderScroll() to make the header float
  // over content and fade/slide away on scroll-down, back on scroll-up.
  // Omit for the default static, in-flow header (no behavior change).
  hideProgress?: Animated.Value
}

export function AppHeader({ showLogo = false, title, leftAction, rightAction, transparent = false, hideProgress }: Props) {
  const insets = useSafeAreaInsets()
  const totalHeight = APP_HEADER_BAR_HEIGHT + insets.top

  const floatingStyle = hideProgress && {
    opacity: hideProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      {
        translateY: hideProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -totalHeight] }),
      },
    ],
  }

  return (
    <Animated.View
      style={[
        styles.root,
        transparent && styles.rootTransparent,
        { paddingTop: insets.top },
        hideProgress && styles.rootFloating,
        floatingStyle,
      ]}
      pointerEvents={hideProgress ? 'box-none' : 'auto'}
    >
      <View style={styles.bar}>
        <View style={styles.side}>
          {showLogo ? <LogoMark size={22} style={styles.sideLogo} /> : (leftAction ?? <View />)}
        </View>

        <View style={styles.center}>
          {showLogo ? (
            <Text style={styles.logo}>Gorave</Text>
          ) : title ? (
            <Text style={styles.title}>{title}</Text>
          ) : null}
        </View>

        <View style={[styles.side, styles.sideRight]}>{rightAction ?? <View />}</View>
      </View>
    </Animated.View>
  )
}

export function HeaderIconBtn({
  children,
  onPress,
}: {
  children: ReactNode
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={styles.iconBtn}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  rootTransparent: {
    backgroundColor: 'transparent',
  },
  rootFloating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  // Fixed (not min) width, equal on both sides — the center column is only
  // truly centered on screen when both flanking columns are the same width,
  // regardless of how much content either one actually holds. Sized to fit
  // the widest real usage (two 36px icon buttons + gap).
  side: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  sideLogo: {
    marginLeft: 6,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: Colors.inkPrimary,
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
