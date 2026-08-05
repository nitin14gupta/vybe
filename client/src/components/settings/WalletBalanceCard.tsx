import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Wallet, HeadphonesIcon } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

export function WalletBalanceCard({ balance, loading }: { balance: number; loading: boolean }) {
  return (
    <>
      <LinearGradient
        colors={['#FF6B35', '#FF3864']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.balanceCard}
      >
        <View style={s.balanceIconRow}>
          <Wallet size={20} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />
          <Text style={s.balanceLabel}>Wallet Balance</Text>
        </View>
        {loading ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
        ) : (
          <Text style={s.balanceAmount}>₹{balance}</Text>
        )}
        <Text style={s.balanceNote}>Credits expire 6 months from date earned</Text>
      </LinearGradient>

      <Pressable style={s.infoCard} onPress={() => router.push('/(settings)/support' as any)}>
        <View style={s.infoRow}>
          <View style={s.infoIconWrap}>
            <HeadphonesIcon size={15} color={Colors.brandOrange} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.infoText}>Credits can only be used on Gorave events.</Text>
            <Text style={s.infoSub}>Need a bank refund or have a question? <Text style={s.infoLink}>Contact Support →</Text></Text>
          </View>
        </View>
      </Pressable>
    </>
  )
}

const s = StyleSheet.create({
  balanceCard: { margin: 16, borderRadius: 20, padding: 24 },
  balanceIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  balanceLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontFamily: FontFamily.headingBold, fontSize: 48, color: '#fff', marginVertical: 4 },
  balanceNote: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  infoCard: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 19 },
  infoSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginTop: 2 },
  infoLink: { fontFamily: FontFamily.bodyMedium, color: Colors.brandOrange },
})
