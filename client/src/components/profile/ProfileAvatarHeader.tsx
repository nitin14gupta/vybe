import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image, ImageSource } from 'expo-image'
import { MapPin } from 'lucide-react-native'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'

interface Props {
  name: string
  gender: string | null
  city: string | null
  avatarUrl: string | null
  hostBadgeImage: ImageSource | number | null
  onAvatarLongPress: () => void
}

export function ProfileAvatarHeader({ name, gender, city, avatarUrl, hostBadgeImage, onAvatarLongPress }: Props) {
  return (
    <View style={styles.headerSection}>
      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Pressable onLongPress={onAvatarLongPress} delayLongPress={400}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarLarge}
              cachePolicy="memory-disk"
              priority="high"
              transition={150}
            />
          </Pressable>
        ) : (
          <View style={[styles.avatarLarge, styles.avatarFallback]}>
            <Text style={styles.avatarInitialLarge}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {hostBadgeImage && (
          <View style={styles.hostBadgeChip}>
            <Image source={hostBadgeImage} style={styles.hostBadgeImg} contentFit="contain" />
          </View>
        )}
      </View>

      <View style={styles.nameRow}>
        <Text style={[styles.nameLarge, { marginBottom: 0 }]} numberOfLines={1}>{name}</Text>
      </View>

      <View style={styles.pillsRowCentered}>
        {gender && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{gender}</Text>
          </View>
        )}
        {city && (
          <View style={styles.pill}>
            <MapPin size={10} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={styles.pillText}>{city}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: Spacing.screenPadding,
  },
  avatarWrap: {
    marginBottom: 16,
    position: 'relative',
  },
  avatarLarge: {
    width: 100, height: 100, borderRadius: 50,
  },
  hostBadgeChip: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.elevated,
    borderWidth: 2,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostBadgeImg: { width: 24, height: 24 },
  avatarFallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitialLarge: {
    fontFamily: FontFamily.headingBold,
    fontSize: 40,
    color: Colors.inkPrimary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  nameLarge: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: Colors.inkPrimary,
    letterSpacing: -0.4,
    marginBottom: 10,
    textAlign: 'center',
  },
  pillsRowCentered: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
})
