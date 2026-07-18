import { useState, useEffect } from 'react'
import RazorpayCustomUI from 'react-native-customui'
import { getUpiAppIcon } from '../../modules/upi-icons'

export interface UpiApp {
  app_name: string
  package_name: string
  app_icon: string  // base64 PNG, read straight off the device via PackageManager
}

export function useInstalledUpiApps(): { apps: UpiApp[]; loading: boolean } {
  const [apps, setApps] = useState<UpiApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    RazorpayCustomUI.getAppsWhichSupportUPI(async (result: any) => {
      // SDK returns { data: [ { appName, packageName } ] } — icon fields are
      // unreliable/empty for anything Razorpay hasn't explicitly branded, so
      // we read the real installed-app icon ourselves via PackageManager.
      const raw: any[] = Array.isArray(result?.data) ? result.data : []
      const withIcons = await Promise.all(raw.map(async (a): Promise<UpiApp> => ({
        app_name: a.appName ?? '',
        package_name: a.packageName ?? '',
        app_icon: (await getUpiAppIcon(a.packageName ?? '')) ?? '',
      })))
      if (!cancelled) {
        setApps(withIcons)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [])

  return { apps, loading }
}
