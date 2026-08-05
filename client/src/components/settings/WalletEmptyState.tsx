import { View, Text, StyleSheet } from 'react-native'
import { Receipt } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

export function WalletEmptyState() {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyIconWrap}>
        <Receipt size={32} color={Colors.inkDisabled} strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>No transactions yet</Text>
      <Text style={s.emptySubtitle}>
        When you receive refunds or pay for events with your wallet, they'll appear here.
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary, marginBottom: 8 },
  emptySubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 21 },
})
