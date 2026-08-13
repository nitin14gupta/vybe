import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated from 'react-native-reanimated'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hTap } from '@/lib/haptics'
import { Pencil, Plus, Settings, Share } from 'lucide-react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { AppHeader, APP_HEADER_BAR_HEIGHT, CreateEventSheet, HeaderIconBtn, BrandedLoader, BrandedRefreshControl, PrimaryButton } from '@/components/ui'
import { ProfileAvatarHeader } from '@/components/profile/ProfileAvatarHeader'
import { ProfileStatsRow } from '@/components/profile/ProfileStatsRow'
import { ProfileBioVoiceCard } from '@/components/profile/ProfileBioVoiceCard'
import { ProfileDetailsChips } from '@/components/profile/ProfileDetailsChips'
import { ProfilePhotoGrid } from '@/components/profile/ProfilePhotoGrid'
import { useProfile } from '@/hooks/useProfile'
import { useAuthStore } from '@/store/auth'
import { Colors, ComponentSize, FontFamily, Spacing, HOST_BADGE_IMAGES } from '@/constants'
import { useImageViewer } from '@/hooks/useImageViewer'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'
import { useHeaderAndTabBarScroll } from '@/hooks/useHeaderAndTabBarScroll'

const GENDER_DISPLAY: Record<string, string> = {
  Man: 'Male',
  Woman: 'Female',
  'Non-binary': 'Non-binary',
  'Prefer not to say': '—',
}

export default function ProfileScreen() {
  const { profile, loading, error, refresh } = useProfile()
  const { viewingMedia, openMedia, closeMedia } = useImageViewer()
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { hideProgress, scrollHandler } = useHeaderAndTabBarScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top

  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  useEffect(() => {
    if (profile?.voice_url) player.replace({ uri: profile.voice_url })
  }, [profile?.voice_url])

  useEffect(() => {
    if (profile?.dob !== undefined) useAuthStore.getState().setDob(profile.dob ?? null)
  }, [profile?.dob])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }, [refresh])

  const toggleVoice = () => {
    hTap()
    if (status.playing) {
      player.pause()
    } else {
      // Only seek back to the start once playback has actually finished —
      // seeking on every tap adds a ~1s rebuffer stall for no reason when
      // resuming from a fresh or paused state.
      if (status.duration > 0 && status.currentTime >= status.duration - 0.05) {
        player.seekTo(0)
      }
      player.play()
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <BrandedLoader />
      </View>
    )
  }

  if (error || !profile) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: Colors.inkSecondary, fontFamily: FontFamily.bodyRegular, fontSize: 14, marginBottom: 16 }}>
          {error ?? 'Could not load profile'}
        </Text>
        <Pressable onPress={() => { hTap(); refresh() }} style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 }}>
          <Text style={{ color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 14 }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  const name = profile?.name ?? '—'
  const gender = profile?.gender ? GENDER_DISPLAY[profile.gender] ?? profile.gender : null
  const city = profile?.city ?? null
  const bio = profile?.bio ?? null
  const otherBadges = profile?.badges ?? []
  const interests = profile?.interests ?? []
  const photos = profile?.photos ?? []
  const hostBadgeName = profile?.host_badges?.[0] ?? null
  const hostBadgeImage = hostBadgeName ? HOST_BADGE_IMAGES[hostBadgeName] : null
  const vibers = profile?.vibers_count ?? 0
  const vibing = profile?.vibing_count ?? 0
  const avgRating = profile?.host_avg_rating ?? null
  const reviewCount = profile?.host_review_count ?? 0

  return (
    <View style={styles.root}>
      <AppHeader
        title="Profile"
        hideProgress={hideProgress}
        leftAction={
          <HeaderIconBtn onPress={() => { hTap(); setCreateOpen(true) }}>
            <Plus size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
          </HeaderIconBtn>
        }
        rightAction={
          <HeaderIconBtn onPress={() => router.push('/(settings)')}>
            <Settings size={18} color={Colors.inkSecondary} strokeWidth={1.5} />
          </HeaderIconBtn>
        }
      />

      <CreateEventSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateEvent={() => router.push('/(events)/create' as any)}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight }]}
        refreshControl={<BrandedRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >

        <ProfileAvatarHeader
          name={name}
          gender={gender}
          city={city}
          avatarUrl={photos[0]?.url ?? null}
          hostBadgeImage={hostBadgeImage}
          onAvatarLongPress={() => photos[0] && openMedia([{ url: photos[0].url, type: 'image' }], 0)}
        />

        <View style={styles.actionsRow}>
          <Pressable onPress={() => router.push('/(profile)/edit')} style={styles.actionBtnSecondary}>
            <Pencil size={18} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={styles.actionBtnTextSecondary}>Edit Profile</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Share Profile"
              icon={<Share size={18} color={Colors.background} strokeWidth={2} />}
              onPress={() => {
                hTap()
                router.push({
                  pathname: '/(profile)/qr',
                  params: {
                    userId: profile.id,
                    username: profile.username ?? '',
                    name: profile.name ?? '',
                    avatar: photos[0]?.url ?? '',
                    city: profile.city ?? '',
                    interests: interests.join(','),
                  },
                } as any)
              }}
            />
          </View>
        </View>

        <ProfileStatsRow
          vibers={vibers}
          vibing={vibing}
          avgRating={avgRating}
          reviewCount={reviewCount}
          onVibersPress={() => router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type: 'followers', name: encodeURIComponent(profile.name ?? ''), vibersCount: vibers, vibingCount: vibing } } as any)}
          onVibingPress={() => router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type: 'following', name: encodeURIComponent(profile.name ?? ''), vibersCount: vibers, vibingCount: vibing } } as any)}
          onReviewsPress={() => router.push({ pathname: '/(profile)/host-reviews', params: { id: profile.id, name: encodeURIComponent(profile.name ?? '') } } as any)}
        />

        <ProfileBioVoiceCard
          bio={bio}
          voiceUrl={profile?.voice_url ?? null}
          playing={status.playing}
          onTogglePlay={toggleVoice}
        />

        <ProfileDetailsChips badges={otherBadges} interests={interests} />

        <ProfilePhotoGrid
          photos={photos}
          onPhotoPress={(i) => openMedia(photos.map(p => ({ url: p.url, type: 'image' as const })), i)}
        />

        <View style={{ height: 36 }} />
      </Animated.ScrollView>

      {viewingMedia && (
        <MediaViewerModal
          visible={!!viewingMedia}
          items={viewingMedia.items}
          initialIndex={viewingMedia.initialIndex}
          onClose={closeMedia}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: ComponentSize.navBar + 32 },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: 24,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    height: 52,
    borderRadius: 26,
  },
  actionBtnTextSecondary: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
})
