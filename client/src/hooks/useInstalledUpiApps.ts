import { useState, useEffect } from 'react'
import RazorpayCustomUI from 'react-native-customui'

export interface UpiApp {
  app_name: string
  package_name: string
  app_icon: string  // base64 PNG from Android system
}

export function useInstalledUpiApps(): { apps: UpiApp[]; loading: boolean } {
  const [apps, setApps]     = useState<UpiApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    RazorpayCustomUI.getAppsWhichSupportUPI((result: UpiApp[]) => {
      setApps(Array.isArray(result) ? result : [])
      setLoading(false)
    })
  }, [])

  return { apps, loading }
}
