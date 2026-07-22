import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService from '@/api/apiService'

export interface PaymentData {
  eventTitle: string
  ticketPrice: number
  platformFee: number
  total: number
  walletBalance: number
  loading: boolean
  error: string | null
}

export function usePaymentData(eventId: string | undefined): PaymentData {
  const [eventTitle, setEventTitle]     = useState('')
  const [ticketPrice, setTicketPrice]   = useState(0)
  const [platformFee, setPlatformFee]   = useState(0)
  const [total, setTotal]               = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    Promise.all([ApiService.getEvent(eventId), ApiService.getWallet()])
      .then(([ev, wallet]) => {
        setEventTitle(ev.title)
        setTicketPrice(ev.price_inr)
        const fee = ev.platform_fee_inr
        setPlatformFee(fee)
        setTotal(ev.price_inr + fee)
        setWalletBalance(wallet.balance)
      })
      .catch(() => setError("Couldn't load payment details"))
      .finally(() => setLoading(false))
  }, [eventId]))

  return { eventTitle, ticketPrice, platformFee, total, walletBalance, loading, error }
}
