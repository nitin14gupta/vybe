import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, Dimensions, RefreshControl, ActivityIndicator
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { router } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { MapPin, Play, Pause, Pencil, Settings, Share, Ticket, Calendar, Plus } from 'lucide-react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { InterestChip, PlaybackWave, AppHeader, HeaderIconBtn, BrandedLoader, TabSwitcher, SmallEventCard, OutlineButton } from '@/components/ui'
import { useProfile } from '@/hooks/useProfile'
import ApiService, { EventSummary } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
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

const HOST_BADGES: Record<string, any> = {
  'Ignite': require('@/assets/images/flame.svg'),
  'Buzzing': require('@/assets/images/lightning.svg'),
  'Iconic': require('@/assets/images/crown.svg'),
  'Gorave OG': require('@/assets/images/star.svg'),
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
    if (status.playing) { player.pause() } else { player.seekTo(0); player.play() }
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
  const hostBadgeName = allBadges.find(b => HOST_BADGES[b])
  const hostBadgeIcon = hostBadgeName ? HOST_BADGES[hostBadgeName] : null
  const otherBadges = allBadges.filter(b => b !== hostBadgeName)
  const vibers = profile?.vibers_count ?? 0
  const vibing = profile?.vibing_count ?? 0
  const posts = profile?.photos?.length ?? 0

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
            {hostBadgeIcon && (
              <ExpoImage source={hostBadgeIcon} style={{ width: 40, height: 40 }} contentFit="contain" />
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
          <Pressable
            onPress={() => {
              hTap()
              router.push({
                pathname: '/(profile)/qr',
                params: { userId: profile.id, username: profile.username ?? '', name: profile.name ?? '' },
              } as any)
            }}
            style={styles.actionBtnPrimary}
          >
            <Share size={18} color={'#111'} strokeWidth={2} />
            <Text style={styles.actionBtnTextPrimary}>Share Profile</Text>
          </Pressable>
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
          <StatCol value={posts} label="Posts" sub="photos" />
        </View>

        {/* ── Bio & Voice Intro ── */}
        {(bio || profile?.voice_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About me</Text>
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}

            {profile?.voice_url ? (
              <View style={styles.voiceCard}>
                <Pressable onPress={toggleVoice} style={styles.voicePlayBtn}>
                  {status.playing
                    ? <Pause size={15} color={Colors.background} strokeWidth={2.5} />
                    : <Play size={15} color={Colors.background} strokeWidth={2.5} />
                  }
                </Pressable>
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
                const icon = HOST_BADGES[badge]
                return (
                  <View key={badge} style={styles.badgeChip}>
                    {icon && <ExpoImage source={icon} style={{ width: 14, height: 14, marginRight: 6 }} contentFit="contain" />}
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
                <Pressable style={styles.emptyCtaBtn} onPress={() => router.push('/(tabs)/events' as any)}>
                  <Text style={styles.emptyCtaBtnText}>Browse Events</Text>
                </Pressable>
              </View>
            ) : activeTab === 'hosted' && eventsHosted.length === 0 ? (
              <View style={styles.emptyCenter}>
                <Calendar size={52} color={Colors.inkDisabled} strokeWidth={1.2} />
                <Text style={styles.emptyTitle}>No upcoming events</Text>
                <Text style={styles.emptySub}>Events you host will appear here</Text>
                <Pressable style={styles.emptyCtaBtn} onPress={() => router.push('/(events)/create' as any)}>
                  <Plus size={16} color="#111" strokeWidth={2.5} />
                  <Text style={styles.emptyCtaBtnText}>Create Event</Text>
                </Pressable>
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
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brandOrange,
    height: 52,
    borderRadius: 26,
  },
  actionBtnTextPrimary: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: '#111',
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
  voicePlayBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
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
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: Colors.brandOrange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyCtaBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: '#111'
  },
})
