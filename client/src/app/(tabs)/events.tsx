import { View, Text, StyleSheet } from 'react-native'
import { Ticket } from 'lucide-react-native'
import { AppHeader } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'

export default function EventsScreen() {
  return (
    <View style={styles.root}>
      <AppHeader title="Events" />
      <View style={styles.empty}>
        <Ticket size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
        <Text style={styles.emptyTitle}>Events coming soon</Text>
        <Text style={styles.emptySub}>Host and discover local vybes near you</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', paddingHorizontal: 32 },
})
