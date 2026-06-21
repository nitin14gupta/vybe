import { useState } from 'react'
import { useAuth } from './useAuth'

export function useLogoutConfirm() {
  const [visible, setVisible] = useState(false)
  const { handleLogout } = useAuth()

  return {
    visible,
    show: () => setVisible(true),
    confirm: handleLogout,
    dismiss: () => setVisible(false),
  }
}
