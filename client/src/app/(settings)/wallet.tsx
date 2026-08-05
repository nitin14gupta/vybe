import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'
import { useWallet } from '@/hooks/useWallet'
import { WalletBalanceCard } from '@/components/settings/WalletBalanceCard'
import { WalletEmptyState } from '@/components/settings/WalletEmptyState'
import { WalletTransactionRow, WalletTxDivider } from '@/components/settings/WalletTransactionRow'

export default function WalletScreen() {
  const { balance, transactions, loading, refreshing, reload } = useWallet()

  return (
    <View style={s.root}>
      <AppHeader
        title="Gorave Wallet"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <WalletTransactionRow item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => reload(true)}
            tintColor={Colors.brandOrange}
            colors={[Colors.brandOrange]}
          />
        }
        ListHeaderComponent={
          <>
            <WalletBalanceCard balance={balance} loading={loading} />
            {transactions.length > 0 && <Text style={s.sectionLabel}>TRANSACTIONS</Text>}
          </>
        }
        ListEmptyComponent={!loading ? <WalletEmptyState /> : null}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={WalletTxDivider}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.88,
    color: Colors.inkSecondary, marginTop: 8, marginBottom: 4, marginLeft: 20,
  },
})
