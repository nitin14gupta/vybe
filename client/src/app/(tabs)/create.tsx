import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontFamily } from '@/constants'

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create Event</Text>
      <Text style={styles.sub}>Phase 2</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginTop: 8 },
})
