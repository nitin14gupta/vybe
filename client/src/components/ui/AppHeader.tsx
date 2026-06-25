import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReactNode } from 'react'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

interface Props {
  showLogo?: boolean
  title?: string
  leftAction?: ReactNode
  rightAction?: ReactNode
}

export function AppHeader({ showLogo = false, title, leftAction, rightAction }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <View style={styles.side}>{leftAction ?? <View />}</View>

        <View style={styles.center}>
          {showLogo ? (
            <Text style={styles.logo}>VYBE</Text>
          ) : title ? (
            <Text style={styles.title}>{title}</Text>
          ) : null}
        </View>

        <View style={[styles.side, styles.sideRight]}>{rightAction ?? <View />}</View>
      </View>
    </View>
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
      onPress={() => { hTap(); onPress?.() }}
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
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  side: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.brandOrange,
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
