// Store listing links — single source of truth for "Rate the app" and any
// future share-the-app flows.
import { Platform } from 'react-native'

const ANDROID_PACKAGE = 'in.gorave.app' // matches android.package in app.json

const APP_STORE_ID = ''

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
export const APP_STORE_URL = APP_STORE_ID ? `https://apps.apple.com/app/id${APP_STORE_ID}` : null
export const RATE_APP_URL = (Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL) ?? PLAY_STORE_URL

// Placeholder handles — swap for Gorave's real profiles.
export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/gorave.app',
  snapchat: 'https://snapchat.com/add/gorave.app',
  facebook: 'https://facebook.com/gorave.app',
}
