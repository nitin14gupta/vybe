import { StyleSheet, View, Text } from 'react-native'
import { Link } from 'expo-router'
import { GlassView } from 'expo-glass-effect'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'

export default function StackedButtonDemoIndex() {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <GlassView glassEffectStyle="clear" isInteractive style={styles.glass}>
          <Text style={styles.text}>
            <Link href="/(settings)/stacked-button-demo/sheet" suppressHighlighting>
              Sign
            </Link>
          </Text>
        </GlassView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 16,
  },
  text: {
    padding: 16,
    textAlign: 'center',
    width: 280,
    fontSize: 16,
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.inkPrimary,
  },
  glass: {
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
