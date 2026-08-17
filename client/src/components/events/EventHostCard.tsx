import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ghost, Star, ChevronRight } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, HOST_BADGE_IMAGES } from '@/constants'
import type { EventDetail } from '@/api/apiService'

interface Props {
  event: EventDetail
  isHost: boolean
}

export function EventHostCard({ event, isHost }: Props) {
  const router = useRouter()

  if (!event.host_name) return null

  const hostBadgeName = event.host_badges?.find(b => HOST_BADGE_IMAGES[b])
  const hostBadgeImage = hostBadgeName ? HOST_BADGE_IMAGES[hostBadgeName] : null

  return (
    // Plain shell — the "profile" zone and the "rating" zone below are true
    // sibling Pressables, not one nested inside the other (a Pressable
    // nested inside another Pressable's subtree breaks tap handling and
    // background rendering on Android — see HotlistButton for the same note).
    <View style={styles.hostCard}>
      <Pressable
        style={styles.hostMain}
        onPress={() => router.push(isHost ? '/(tabs)/profile' : `/(profile)/${event.host_id}` as any)}
      >
        <View style={styles.hostAvatarWrap}>
          <View style={[styles.hostAvatar, event.host_is_deleted && styles.hostAvatarDeleted]}>
            {event.host_is_deleted ? (
              <Ghost size={20} color={Colors.inkDisabled} strokeWidth={1.5} />
            ) : event.host_avatar ? (
              <Image
                source={{ uri: event.host_avatar }}
                style={styles.hostAvatarImg}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="normal"
                transition={150}
              />
            ) : (
              <Text style={styles.hostAvatarFallback}>{event.host_name[0]}</Text>
            )}
          </View>
          {!event.host_is_deleted && hostBadgeImage ? (
            <View style={styles.hostBadgeChip}>
              <Image source={hostBadgeImage} style={styles.hostBadgeImg} contentFit="contain" />
            </View>
          ) : null}
        </View>
        <View style={styles.hostInfo}>
          <Text style={styles.hostLabel}>Hosted by</Text>
          <Text style={[styles.hostName, event.host_is_deleted && styles.hostNameDeleted]}>
            {event.host_is_deleted ? '[deleted]' : isHost ? 'You' : event.host_name}
          </Text>
        </View>
        {event.host_is_deleted && <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />}
      </Pressable>

      {!event.host_is_deleted && (
        <Pressable
          style={styles.ratingWrap}
          onPress={() => router.push(`/(profile)/host-reviews?id=${event.host_id}&name=${encodeURIComponent(event.host_name ?? '')}` as any)}
        >
          <View>
            <View style={styles.ratingRow}>
              <Star size={13} color={Colors.accentGold} fill={Colors.accentGold} strokeWidth={0} />
              <Text style={styles.ratingValue}>{event.host_avg_rating != null ? event.host_avg_rating.toFixed(1) : '—'}</Text>
            </View>
            <Text style={styles.ratingSub}>{event.host_review_count} rating{event.host_review_count === 1 ? '' : 's'}</Text>
          </View>
          <ChevronRight size={14} color={Colors.inkDisabled} strokeWidth={2} style={styles.ratingChevron} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    marginBottom: 16,
  },
  hostMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary },
  ratingSub: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled },
  ratingChevron: { marginLeft: 2 },
  hostAvatarWrap: { position: 'relative' },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.elevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarImg: { width: '100%', height: '100%' },
  hostAvatarFallback: { color: Colors.inkPrimary, fontFamily: FontFamily.headingBold, fontSize: 18 },
  hostAvatarDeleted: { backgroundColor: Colors.surface },
  hostBadgeChip: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostBadgeImg: { width: 14, height: 14 },
  hostInfo: { flex: 1 },
  hostLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginBottom: 2 },
  hostName: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  hostNameDeleted: { color: Colors.inkDisabled, fontFamily: FontFamily.headingBold },
})
