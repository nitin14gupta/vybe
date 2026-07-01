import { useState, useEffect } from 'react'
import RazorpayCustomUI from 'react-native-customui'

export interface UpiApp {
  app_name: string
  package_name: string
  app_icon: string  // base64 PNG
}

export function useInstalledUpiApps(): { apps: UpiApp[]; loading: boolean } {
  const [apps, setApps]       = useState<UpiApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    RazorpayCustomUI.getAppsWhichSupportUPI((result: any) => {
      // SDK returns { data: [ { appName, packageName, iconBase64, appLogo } ] }
      const raw: any[] = Array.isArray(result?.data) ? result.data : []
      setApps(raw.map(a => ({
        app_name:     a.appName     ?? '',
        package_name: a.packageName ?? '',
        app_icon:     a.iconBase64  || a.appLogo || '',
      })))
      setLoading(false)
    })
  }, [])

  return { apps, loading }
}
