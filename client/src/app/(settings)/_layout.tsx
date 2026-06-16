import { Stack } from 'expo-router'
import { Colors } from '@/constants'

export default function SettingsGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }} />
  )
}
