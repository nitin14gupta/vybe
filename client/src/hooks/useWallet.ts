import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type WalletTransaction } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

export interface WalletState {
  balance: number
  transactions: WalletTransaction[]
  loading: boolean
  refreshing: boolean
  reload: (isRefresh?: boolean) => void
}

export function useWallet(): WalletState {
  const showPill = usePillStore(s => s.show)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await ApiService.getWallet()
      setBalance(data.balance)
      setTransactions(data.transactions)
    } catch {
      showPill("Couldn't load your wallet, try again", 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [showPill])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return { balance, transactions, loading, refreshing, reload: load }
}
