// Single source of truth for the app version/build shown in Settings and
// About — every screen should import from here instead of reading
// expo-constants (or app.json) directly, so there's one place to change.
import { Platform } from 'react-native'
import Constants from 'expo-constants'

export const APP_VERSION = Constants.expoConfig?.version

export const APP_BUILD_NUMBER =
  (Platform.OS === 'ios'
    ? Constants.expoConfig?.ios?.buildNumber
    : Constants.expoConfig?.android?.versionCode?.toString()) ?? '1'
