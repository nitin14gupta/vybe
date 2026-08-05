import { View, Pressable, StyleSheet, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { Spacing } from '@/constants'

const { width } = Dimensions.get('window')
const GRID_GAP = 2
const PHOTO_SIZE = (width - (Spacing.screenPadding * 2) - (GRID_GAP * 2)) / 3

interface Photo {
  id: string
  url: string
}

interface Props {
  photos: Photo[]
  onPhotoPress: (index: number) => void
}

export function ProfilePhotoGrid({ photos, onPhotoPress }: Props) {
  if (photos.length === 0) return null

  return (
    <View style={styles.grid}>
      {photos.map((photo, i) => (
        <Pressable
          key={photo.id}
          onPress={() => onPhotoPress(i)}
          onLongPress={() => onPhotoPress(i)}
          delayLongPress={400}
        >
          <Image
            source={{ uri: photo.url }}
            style={styles.gridPhoto}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="low"
            transition={150}
          />
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginHorizontal: Spacing.screenPadding,
  },
  gridPhoto: { width: PHOTO_SIZE, height: PHOTO_SIZE },
})
