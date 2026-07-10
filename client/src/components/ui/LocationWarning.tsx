import { Pressable, Text } from 'react-native'
import { Map } from 'lucide-react-native'
import * as Linking from 'expo-linking'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'
import { useLiveLocation } from '@/hooks/useLiveLocation'

export function LocationWarning() {
  const insets = useSafeAreaInsets()
  const { status } = useLiveLocation()

  if (status === 'granted' || status === undefined) return null

  return (
    <Pressable 
      onPress={() => Linking.openSettings()}
      style={{
        position: 'absolute',
        top: insets.top + 60,
        left: 16,
        right: 16,
        backgroundColor: '#2A1A10',
        borderColor: Colors.brandOrange,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Map size={18} color={Colors.brandOrange} />
      <Text style={{ color: Colors.brandOrange, marginLeft: 10, fontFamily: FontFamily.bodyMedium, fontSize: 13, flex: 1 }}>
        We are having trouble finding your location. Tap to enable it in Settings.
      </Text>
    </Pressable>
  )
}
