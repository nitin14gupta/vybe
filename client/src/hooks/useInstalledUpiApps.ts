import { useState, useEffect } from 'react'
import RazorpayCustomUI from 'react-native-customui'

export interface UpiApp {
  app_name: string
  package_name: string
  app_icon: string  // base64 PNG
}

const FALLBACK_LOGOS: Record<string, string> = {
  'com.google.android.apps.nbu.paisa.user': 'https://img.icons8.com/color/512/google-pay.png', // Replace with your GPay logo URL
  'com.phonepe.app': 'https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png', // Replace with your PhonePe logo URL
  'net.one97.paytm': 'https://download.logo.wine/logo/Paytm/Paytm-Logo.wine.png', // Replace with your Paytm logo URL
  'in.org.npci.upiapp': 'https://download.logo.wine/logo/BHIM/BHIM-Logo.wine.png', // Replace with your BHIM logo URL
  'com.whatsapp': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png', // Replace with your WhatsApp logo URL
  'in.amazon.mShop.android.shopping': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/512px-Amazon_logo.svg.png', // Replace with your Amazon Pay logo URL
  'com.dreamplug.androidapp': 'https://webimages.credcdn.in/_next/assets/images/home-page/cred-logo.png', // Replace with your CRED logo URL
}

export function useInstalledUpiApps(): { apps: UpiApp[]; loading: boolean } {
  const [apps, setApps] = useState<UpiApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    RazorpayCustomUI.getAppsWhichSupportUPI((result: any) => {
      // SDK returns { data: [ { appName, packageName, iconBase64, appLogo } ] }
      const raw: any[] = Array.isArray(result?.data) ? result.data : []
      setApps(raw.map(a => ({
        app_name: a.appName ?? '',
        package_name: a.packageName ?? '',
        app_icon: a.iconBase64 || a.appLogo || FALLBACK_LOGOS[a.packageName] || '',
      })))
      setLoading(false)
    })
  }, [])

  return { apps, loading }
}
