import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type WalletTransaction } from '@/api/apiService'

export interface WalletState {
  balance: number
  transactions: WalletTransaction[]
  loading: boolean
  refreshing: boolean
  reload: (isRefresh?: boolean) => void
}

export function useWallet(): WalletState {
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
      // silent — screen shows empty state
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return { balance, transactions, loading, refreshing, reload: load }
}
