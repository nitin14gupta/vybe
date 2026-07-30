import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, Dimensions, RefreshControl, ActivityIndicator
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { router } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { MapPin, Pencil, Settings, Share, Ticket, Calendar, Plus, Star } from 'lucide-react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { InterestChip, PlaybackWave, VoicePlayButton, AppHeader, HeaderIconBtn, BrandedLoader, TabSwitcher, SmallEventCard, OutlineButton, PrimaryButton } from '@/components/ui'
import { useProfile } from '@/hooks/useProfile'
import ApiService, { EventSummary } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { Colors, FontFamily, Spacing, Radius, HOST_BADGE_ICONS } from '@/constants'
import { useImageViewer } from '@/hooks/useImageViewer'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'

const { width } = Dimensions.get('window')
const GRID_GAP = 2
const PHOTO_SIZE = (width - (Spacing.screenPadding * 2) - (GRID_GAP * 2)) / 3

const GENDER_DISPLAY: Record<string, string> = {
  Man: 'Male',
  Woman: 'Female',
  'Non-binary': 'Non-binary',
  'Prefer not to say': '—',
}

export default function ProfileScreen() {
  const { profile, loading, error, refresh } = useProfile()
  const { viewingMedia, openMedia, closeMedia } = useImageViewer()
  const [activeTab, setActiveTab] = useState<'going' | 'hosted'>('going')
  const [eventsAttending, setEventsAttending] = useState<EventSummary[]>([])
  const [eventsHosted, setEventsHosted] = useState<EventSummary[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  useEffect(() => {
    if (profile?.voice_url) player.replace({ uri: profile.voice_url })
  }, [profile?.voice_url])

  useEffect(() => {
    if (profile?.dob !== undefined) useAuthStore.getState().setDob(profile.dob ?? null)
  }, [profile?.dob])

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    if (profile?.id) {
      try {
        const ext = await ApiService.getUserProfile(profile.id)
        setEventsAttending(ext.events_attending || [])
        setEventsHosted(ext.events_hosted || [])
      } catch { }
    }
    setRefreshing(false)
  }, [refresh, profile?.id])

  useEffect(() => {
    if (profile?.id) {
      setEventsLoading(true)
      ApiService.getUserProfile(profile.id)
        .then(ext => {
          setEventsAttending(ext.events_attending || [])
          setEventsHosted(ext.events_hosted || [])
        })
        .finally(() => setEventsLoading(false))
    }
  }, [profile?.id])

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
  const allBadges = profile?.badges ?? []
  const hostBadgeName = allBadges.find(b => HOST_BADGE_ICONS[b])
  const HostBadgeIcon = hostBadgeName ? HOST_BADGE_ICONS[hostBadgeName] : null
  const otherBadges = allBadges.filter(b => b !== hostBadgeName)
  const vibers = profile?.vibers_count ?? 0
  const vibing = profile?.vibing_count ?? 0
  const avgRating = profile?.host_avg_rating ?? null
  const reviewCount = profile?.host_review_count ?? 0

  return (
    <View style={styles.root}>
      <AppHeader
        title="Profile"
        rightAction={
          <HeaderIconBtn onPress={() => router.push('/(settings)')}>
            <Settings size={18} color={Colors.inkSecondary} strokeWidth={1.5} />
          </HeaderIconBtn>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandOrange} colors={[Colors.brandOrange]} />}>

        {/* ── Top Header / Avatar Area ── */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrap}>
            {profile?.photos?.[0]?.url ? (
              <Pressable onLongPress={() => openMedia([{ url: profile!.photos[0].url, type: 'image' }], 0)} delayLongPress={400}>
                <Image source={{ uri: profile.photos[0].url }} style={styles.avatarLarge} />
              </Pressable>
            ) : (
              <View style={[styles.avatarLarge, styles.avatarFallback]}>
                <Text style={styles.avatarInitialLarge}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
            <Text style={[styles.nameLarge, { marginBottom: 0 }]} numberOfLines={1}>{name}</Text>
            {HostBadgeIcon && (
              <HostBadgeIcon size={20} color={Colors.accentGold} strokeWidth={2} style={{ marginLeft: -2 }} />
            )}
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

        {/* ── Action Buttons ── */}
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
                    avatar: profile.photos?.[0]?.url ?? '',
                    city: profile.city ?? '',
                    interests: (profile.interests ?? []).join(','),
                  },
                } as any)
              }}
            />
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsCard}>
          <StatCol
            value={vibers} label="Vibers" sub="fans vibin'"
            onPress={() => profile && router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type: 'followers', name: encodeURIComponent(profile.name ?? ''), vibersCount: vibers, vibingCount: vibing } } as any)}
          />
          <View style={styles.statDivider} />
          <StatCol
            value={vibing} label="Vibing" sub="folks feelin'"
            onPress={() => profile && router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type: 'following', name: encodeURIComponent(profile.name ?? ''), vibersCount: vibers, vibingCount: vibing } } as any)}
          />
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <View style={styles.ratingRow}>
              {avgRating != null && <Star size={14} color={Colors.accentGold} fill={Colors.accentGold} strokeWidth={0} />}
              <Text style={styles.statValue}>{avgRating != null ? avgRating.toFixed(1) : '—'}</Text>
            </View>
            <Text style={styles.statLabel}>Reviews</Text>
            <Text style={styles.statSub}>{reviewCount} rating{reviewCount === 1 ? '' : 's'}</Text>
          </View>
        </View>

        {/* ── Bio & Voice Intro ── */}
        {(bio || profile?.voice_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About me</Text>
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}

            {profile?.voice_url ? (
              <View style={styles.voiceCard}>
                <VoicePlayButton playing={status.playing} onPress={toggleVoice} />
                <View style={styles.voiceWave}>
                  <PlaybackWave isActive={status.playing} compact />
                </View>
                <Text style={styles.voiceLabel}>Voice intro</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Details: Badges & Interests ── */}
        {(otherBadges.length > 0 || (profile?.interests?.length ?? 0) > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Details</Text>
            <View style={styles.chipsWrap}>
              {otherBadges.map(badge => {
                const Icon = HOST_BADGE_ICONS[badge]
                return (
                  <View key={badge} style={styles.badgeChip}>
                    {Icon && <Icon size={13} color={Colors.accentGold} strokeWidth={2} style={{ marginRight: 4 }} />}
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )
              })}
              {profile?.interests?.map(tag => (
                <InterestChip key={tag} label={tag} emoji="" selected onPress={() => { }} />
              ))}
            </View>
          </View>
        )}

        {/* ── Events Tabs ── */}
        {(eventsAttending.length > 0 || eventsHosted.length > 0 || eventsLoading) && (
          <View style={styles.section}>
            <TabSwitcher
              tabs={['Going to', 'Hosted']}
              activeTab={activeTab === 'going' ? 'Going to' : 'Hosted'}
              onChange={(tab) => setActiveTab(tab === 'Going to' ? 'going' : 'hosted')}
            />
            {eventsLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.brandOrange} />
              </View>
            ) : activeTab === 'going' && eventsAttending.length === 0 ? (
              <View style={styles.emptyCenter}>
                <Ticket size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
                <Text style={styles.emptyTitle}>No upcoming tickets</Text>
                <Text style={styles.emptySub}>Events you RSVP to will appear here</Text>
                <PrimaryButton
                  label="Browse Events"
                  size="small"
                  style={styles.emptyCtaBtn}
                  onPress={() => router.push('/(tabs)/events' as any)}
                />
              </View>
            ) : activeTab === 'hosted' && eventsHosted.length === 0 ? (
              <View style={styles.emptyCenter}>
                <Calendar size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
                <Text style={styles.emptyTitle}>No upcoming events</Text>
                <Text style={styles.emptySub}>Events you host will appear here</Text>
                <PrimaryButton
                  label="Create Event"
                  size="small"
                  style={styles.emptyCtaBtn}
                  icon={<Plus size={16} color={Colors.background} strokeWidth={2.5} />}
                  onPress={() => router.push('/(events)/create' as any)}
                />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 12 }}>
                {activeTab === 'going' && eventsAttending.slice(0, 3).map(item => (
                  <SmallEventCard key={item.id} event={item} />
                ))}

                {activeTab === 'hosted' && eventsHosted.slice(0, 3).map(item => (
                  <SmallEventCard key={item.id} event={item} />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── Photo grid ── */}
        {(profile?.photos?.length ?? 0) > 0 && (
          <View style={styles.grid}>
            {profile!.photos.map((photo, i) => (
              <Pressable
                key={photo.id}
                onPress={() => openMedia(profile!.photos.map(p => ({ url: p.url, type: 'image' as const })), i)}
                onLongPress={() => openMedia(profile!.photos.map(p => ({ url: p.url, type: 'image' as const })), i)}
                delayLongPress={400}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.gridPhoto}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 36 }} />
      </ScrollView>

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

function StatCol({ value, label, sub, onPress }: { value: number; label: string; sub: string; onPress?: () => void }) {
  const inner = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </>
  )
  if (onPress) {
    return <Pressable style={styles.statCol} onPress={onPress} android_ripple={null}>{inner}</Pressable>
  }
  return <View style={styles.statCol}>{inner}</View>
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingBottom: 32 },

  // ── Header Section ──
  headerSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: Spacing.screenPadding,
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100, height: 100, borderRadius: 50,
  },
  avatarFallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitialLarge: {
    fontFamily: FontFamily.headingBold,
    fontSize: 40,
    color: Colors.inkPrimary,
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

  // ── Action Buttons ──
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
  // ── Stats Row ──
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPadding,
    borderRadius: Radius.card,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  statSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
  },
  statDivider: {
    width: 1, height: 40,
    backgroundColor: Colors.divider,
  },

  // ── Common Section ──
  section: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    marginBottom: 12,
  },

  // Bio
  bio: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },

  // Chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,184,48,0.12)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.accentGold,
  },

  // Voice
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  voiceWave: { flex: 1, overflow: 'hidden' },
  voiceLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
  },

  // Photos
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginHorizontal: Spacing.screenPadding,
  },
  gridPhoto: { width: PHOTO_SIZE, height: PHOTO_SIZE },

  // Events
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32
  },
  emptyTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary
  },
  emptySub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center'
  },
  emptyCtaBtn: { marginTop: 8 },
})
