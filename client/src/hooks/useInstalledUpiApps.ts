import { useState, useEffect } from 'react'
import { Linking, Platform } from 'react-native'
import RazorpayCustomUI from 'react-native-customui'
import { getUpiAppIcon } from '../../modules/upi-icons'
import { IOS_UPI_APPS } from '@/constants/upiApps'

export interface UpiApp {
  app_name: string
  package_name: string
  // base64 PNG on Android (read via PackageManager) or a require()'d bundled
  // asset id on iOS (rendered via <Image source={number}> — see payment.tsx)
  app_icon: string | number
}

async function detectAndroidApps(): Promise<UpiApp[]> {
  const result: any = await new Promise(resolve => {
    RazorpayCustomUI.getAppsWhichSupportUPI((r: any) => resolve(r))
  })
  const raw: any[] = Array.isArray(result?.data) ? result.data : []
  return Promise.all(raw.map(async (a): Promise<UpiApp> => ({
    app_name: a.appName ?? '',
    package_name: a.packageName ?? '',
    app_icon: (await getUpiAppIcon(a.packageName ?? '')) ?? '',
  })))
}

async function detectIosApps(): Promise<UpiApp[]> {
  const checks = await Promise.all(
    IOS_UPI_APPS.map(app => Linking.canOpenURL(`${app.scheme}://`).catch(() => false)),
  )
  return IOS_UPI_APPS
    .filter((_, i) => checks[i])
    .map(app => ({
      app_name: app.app_name,
      package_name: app.package_name,
      app_icon: app.icon ?? '',
    }))
}

export function useInstalledUpiApps(): { apps: UpiApp[]; loading: boolean } {
  const [apps, setApps] = useState<UpiApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const detect = Platform.OS === 'android' ? detectAndroidApps() : detectIosApps()
    detect
      .then(result => { if (!cancelled) setApps(result) })
      .catch(() => { if (!cancelled) setApps([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { apps, loading }
}
