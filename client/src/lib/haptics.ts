import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

async function run(fn: () => Promise<void>, label: string): Promise<void> {
  try {
    await fn()
  } catch (e) {
    console.warn(`[haptics] ${label} failed:`, e)
  }
}

// Confirmed on-device (Haptics Test panel, Home): of every AndroidHaptics
// effect, only Long_Press actually produces a felt vibration — Virtual_Key,
// Context_Click, Confirm, Reject, Segment_Tick, Toggle_On/Off all silently
// no-op. This is a known Android/OEM fragmentation issue: those map to
// VibrationEffect predefined constants (EFFECT_CLICK/EFFECT_TICK/etc.) that
// many devices' vibrator HAL doesn't implement, so they're dropped with no
// error. Long_Press apparently falls back to a real one-shot vibration.
// Standardizing every Android call on it — real (if less nuanced) feedback
// beats "semantically correct" effects nobody can feel.
const ANDROID_HAPTIC = Haptics.AndroidHaptics.Long_Press

export const hTap = () =>
  run(
    () => Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID_HAPTIC)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    'hTap',
  )

export const hMedium = () =>
  run(
    () => Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID_HAPTIC)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    'hMedium',
  )

export const hHeavy = () =>
  run(
    () => Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID_HAPTIC)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    'hHeavy',
  )

export const hSuccess = () =>
  run(
    () => Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID_HAPTIC)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    'hSuccess',
  )

export const hError = () =>
  run(
    () => Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID_HAPTIC)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    'hError',
  )

export const hSelection = () =>
  run(
    () => Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID_HAPTIC)
      : Haptics.selectionAsync(),
    'hSelection',
  )

export const hToggle = (_on: boolean) =>
  run(
    () => Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID_HAPTIC)
      : Haptics.selectionAsync(),
    'hToggle',
  )

