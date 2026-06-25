import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

// Prefer performAndroidHapticsAsync on Android (no VIBRATE permission needed, better engine)
// Fall back to impactAsync/notificationAsync on iOS/Web

export const hTap = () =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

export const hMedium = () =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

export const hHeavy = () =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

export const hSuccess = () =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

export const hError = () =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

export const hSelection = () =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
    : Haptics.selectionAsync()

export const hToggle = (on: boolean) =>
  Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(
        on ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off,
      )
    : Haptics.selectionAsync()
