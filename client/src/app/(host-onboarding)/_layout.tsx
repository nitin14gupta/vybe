import { Stack } from 'expo-router'
import { Colors } from '@/constants'

export default function HostOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    />
  )
}
