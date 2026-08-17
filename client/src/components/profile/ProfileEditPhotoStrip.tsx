import { StyleSheet, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { Plus } from 'lucide-react-native'
import { Colors, Radius, withOpacity } from '@/constants'
import type { PhotoResponse } from '@/types/api'

const SLOT_COUNT = 6

interface Props {
  photos?: PhotoResponse[]
}

export function ProfileEditPhotoStrip({ photos }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {Array.from({ length: SLOT_COUNT }).map((_, i) => {
        const photo = photos?.find(p => p.position === i) || photos?.[i]
        return (
          <Pressable key={i} onPress={() => router.push('/(profile)/edit-photos')} style={styles.slot}>
            {photo ? (
              <Image
                source={photo.url}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="low"
                transition={120}
              />
            ) : (
              <Plus size={16} color={Colors.inkDisabled} />
            )}
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: 8 },
  slot: {
    width: 100,
    height: 100,
    borderRadius: Radius.sm,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.04),
    borderWidth: 1,
    borderColor: withOpacity(Colors.inkPrimary, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
})
