import { useFonts } from 'expo-font'

const FONT_MAP = {
  'CabinetGrotesk-Extrabold': require('../../assets/fonts/CabinetGrotesk-Extrabold.otf'),
  'CabinetGrotesk-Bold': require('../../assets/fonts/CabinetGrotesk-Bold.otf'),
  'CabinetGrotesk-Medium': require('../../assets/fonts/CabinetGrotesk-Medium.otf'),
  'Satoshi-Regular': require('../../assets/fonts/Satoshi-Regular.otf'),
  'Satoshi-Medium': require('../../assets/fonts/Satoshi-Medium.otf'),
  'Satoshi-Bold': require('../../assets/fonts/Satoshi-Bold.otf'),
} as const

export function useVybeFonts() {
  return useFonts(FONT_MAP)
}
