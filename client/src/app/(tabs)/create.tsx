import { useEffect } from 'react'
import { router } from 'expo-router'

export default function CreateTabPlaceholder() {
  useEffect(() => {
    router.replace('/(tabs)/')
  }, [])
  return null
}
