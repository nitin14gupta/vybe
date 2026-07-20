import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  FlatList, Dimensions, RefreshControl,
} from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { hTap, hMedium, hSuccess } from '@/lib/haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, MoreVertical, Flame, UserPlus, UserCheck,
  MessageCircle, Ban, Play, Pause, Check, Ghost, Clock,
} from 'lucide-react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { VybeRequestModal, VybeIcebreakerModal, PlaybackWave, ProfileMenuSheet, InterestChip, TabSwitcher, SmallEventCard, BrandedLoader } from '@/components/ui'
import ApiService, { ExtendedProfile, EventSummary } from '@/api/apiService'
import { Colors, FontFamily, Radius } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { useVybeStore } from '@/store/vybeStore'
import { useImageViewer } from '@/hooks/useImageViewer'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'
import { useCountdown } from '@/hooks/useCountdown'
import { parseServerDate } from '@/lib/dates'

const { width: W } = Dimensions.get('window')

const HOST_BADGES: Record<string, string> = {
  'Rising': '🛡️',
  'Established': '⭐',
  'Elite': '💎',
  'Legend': '👑',
}

// ── Mini event card ───────────────────────────────────────────────────────────

function formatCooldown(seconds: number): string {
  if (seconds <= 0) return 'a moment'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${Math.max(minutes, 1)}m`
}

// Shown instead of "Send Vybe" while a per-pair cooldown is active (24h after
// a first pass, 7 days after a second) — ticks down locally and flips back
// to a normal Send Vybe button on expiry without needing a re-fetch.
function CooldownPill({ cooldownUntil, onExpiredPress }: { cooldownUntil: string; onExpiredPress: () => void }) {
  const deadline = parseServerDate(cooldownUntil)
  const initialSeconds = deadline ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / 1000)) : 0
  const { seconds, isExpired } = useCountdown(initialSeconds)

  if (isExpired) {
    return (
      <Pressable style={[s.ctaBtn, s.ctaBtnPrimary]} onPress={onExpiredPress}>
        <Flame size={18} color="#111" fill="#111" strokeWidth={2} />
        <Text style={s.ctaBtnPrimaryText}>Send Vybe</Text>
      </Pressable>
    )
  }

  return (
    <Pressable style={[s.ctaBtn, s.ctaBtnPending, { borderColor: Colors.divider }]} disabled>
      <Clock size={16} color={Colors.inkDisabled} strokeWidth={1.8} />
      <Text style={[s.ctaBtnPendingText, { fontSize: 14, color: Colors.inkDisabled }]} numberOfLines={1}>
        Try again in {formatCooldown(seconds)}
      </Text>
    </Pressable>
  )
}

// ── Profile screen ────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [profile, setProfile] = useState<ExtendedProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [following, setFollowing] = useState(false)
  const [vybeModalOpen, setVybeModalOpen] = useState(false)
  const [vybeSent, setVybeSent] = useState(false)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [blockedByMe, setBlockedByMe] = useState(false)
  const [activeTab, setActiveTab] = useState<'going' | 'hosted'>('going')
  const showPill = usePillStore(s => s.show)
  const { markSent, markCleared, isSentTo } = useVybeStore()

  const voicePlayer = useAudioPlayer(null)
  const voiceStatus = useAudioPlayerStatus(voicePlayer)
  const { viewingMedia, openMedia, closeMedia } = useImageViewer()

  useEffect(() => {
    if (!id) return
    ApiService.getUserProfile(id)
      .then(p => {
        setProfile(p)
        setFollowing(!!p.is_following)
        setVybeSent((p.vybe_status === 'pending' && !!p.vybe_sent_by_me) || isSentTo(p.id))
        setBlockedByMe(!!p.is_blocked_by_me)
        if (p.voice_url) voicePlayer.replace({ uri: p.voice_url })
      })
      .catch(() => showPill("Couldn't load this profile", 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!id) return
    setRefreshing(true)
    try {
      const p = await ApiService.getUserProfile(id)
      setProfile(p)
      setFollowing(!!p.is_following)
      setVybeSent((p.vybe_status === 'pending' && !!p.vybe_sent_by_me) || isSentTo(p.id))
      setBlockedByMe(!!p.is_blocked_by_me)
      if (p.voice_url) voicePlayer.replace({ uri: p.voice_url })
    } catch {}
    finally { setRefreshing(false) }
  }, [id])

  const handleFollowToggle = async () => {
    if (!profile) return
    const next = !following
    setFollowing(next)
    try {
      if (next) await ApiService.followUser(profile.id)
      else await ApiService.unfollowUser(profile.id)
    } catch {
      setFollowing(!next)
    }
  }

  const handleSendVybe = async (message: string) => {
    if (!profile) return
    setVybeModalOpen(false)
    setVybeSent(true)
    markSent(profile.id)
    try {
      await ApiService.sendVibe(profile.id, message)
    } catch (err: any) {
      setVybeSent(false)
      markCleared(profile.id)
      showPill(
        err?.status === 429
          ? "You're on cooldown with this person, try again later"
          : "Couldn't send that vybe, try again",
        'error',
      )
    }
  }

  const handleAcceptVybe = async (icebreaker: string) => {
    if (!profile?.vybe_id) return
    setAcceptModalOpen(false)
    try {
      const result = await ApiService.respondToVibe(profile.vybe_id, 'accept', icebreaker)
      if (result.conversation_id) {
        router.replace(`/(chat)/${result.conversation_id}` as any)
      }
    } catch {
      showPill("Couldn't send that vybe, try again", 'error')
    }
  }

  const handleBlock = async () => {
    if (!profile) return
    try {
      await ApiService.blockUser(profile.id)
      setBlockedByMe(true)
    } catch {
      showPill("Couldn't block this person", 'error')
    }
  }

  const handleUnblock = async () => {
    if (!profile) return
    try {
      await ApiService.unblockUser(profile.id)
      setBlockedByMe(false)
    } catch {
      showPill("Couldn't unblock, try again", 'error')
    }
  }

  const handleReport = async (reason: string) => {
    if (!profile) return
    try {
      await ApiService.reportUser(profile.id, reason)
      showPill('Report submitted', 'success')
    } catch {
      showPill('Report not sent, try again', 'error')
    }
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={[s.root, s.center]}>
        <Pressable onPress={() => router.back()} style={[s.backBtn, { position: 'absolute', top: insets.top + 8, left: 0 }]}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <View style={s.deletedIconWrap}>
          <Ghost size={40} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={s.deletedTitle}>Profile Not Found</Text>
        <Text style={s.deletedBody}>This user may not exist or the link is invalid.</Text>
      </View>
    )
  }

  if (profile.is_deleted) {
    return (
      <View style={[s.root, s.center]}>
        <Pressable onPress={() => router.back()} style={[s.backBtn, { position: 'absolute', top: insets.top + 8, left: 0 }]}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <View style={s.deletedIconWrap}>
          <Ghost size={40} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={s.deletedTitle}>Not Found</Text>
        <Text style={s.deletedBody}>This profile is no longer available.</Text>
      </View>
    )
  }

  const photos = profile.photos ?? []
  const isConnected = profile.vybe_status === 'connected'
  const isPending = vybeSent || (profile.vybe_status === 'pending' && !!profile.vybe_sent_by_me)
  const theySentVybe = profile.vybe_status === 'pending' && !profile.vybe_sent_by_me && !vybeSent
  const isCooldown = !isPending && !theySentVybe && profile.vybe_status === 'cooldown' && !!profile.cooldown_until
  const age = profile.dob
    ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / 3.156e10)
    : null

  const allBadges = profile.badges ?? []
  const hostBadgeName = allBadges.find(b => HOST_BADGES[b])
  const hostBadgeIcon = hostBadgeName ? HOST_BADGES[hostBadgeName] : null
  const otherBadges = allBadges.filter(b => b !== hostBadgeName)

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      {/* Header overlay */}
      <View style={[s.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.headerCircleBtn} hitSlop={8}>
          <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
        </Pressable>
        <Pressable onPress={() => { hTap(); setMenuOpen(true) }} style={s.headerCircleBtn} hitSlop={8}>
          <MoreVertical size={20} color="#fff" strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandOrange} colors={[Colors.brandOrange]} />}>
        {/* Photo carousel */}
        {photos.length > 0 ? (
          <View>
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={p => p.id}
              onMomentumScrollEnd={e => setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => openMedia(photos.map(p => ({ url: p.url, type: 'image' })), index)}>
                  <Image source={{ uri: item.url }} style={{ width: W, height: W }} resizeMode="cover" />
                </Pressable>
              )}
            />
            {photos.length > 1 && (
              <View style={s.photoDots}>
                {photos.map((_, i) => (
                  <View key={i} style={[s.photoDot, i === photoIdx && s.photoDotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={s.photoFallback}>
            <Text style={s.photoFallbackInitial}>{(profile.name ?? '?').charAt(0)}</Text>
          </View>
        )}

        <View style={s.body}>
          {/* Name + location */}
          <View style={s.nameRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.name}>
                {profile.name ?? 'User'}{age ? `, ${age}` : ''}
              </Text>
              {hostBadgeIcon && (
                <Text style={{ fontSize: 24, marginLeft: -2 }}>{hostBadgeIcon}</Text>
              )}
            </View>
            {profile.mutual_count > 0 && (
              <Text style={s.mutual}>{profile.mutual_count} mutual</Text>
            )}
          </View>
          {profile.username ? (
            <Text style={s.username}>@{profile.username}</Text>
          ) : null}
          {profile.city ? <Text style={s.city}>{profile.city}</Text> : null}

          {/* Vibers / Vibing stats */}
          {!blockedByMe && (
            <View style={s.statsRow}>
              <Pressable
                style={s.statItem}
                android_ripple={null}
                onPress={() => router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type: 'followers', name: encodeURIComponent(profile.name ?? ''), vibersCount: profile.vibers_count ?? 0, vibingCount: profile.vibing_count ?? 0 } } as any)}
              >
                <Text style={s.statValue}>{profile.vibers_count ?? 0}</Text>
                <Text style={s.statLabel}>Vibers</Text>
              </Pressable>
              <View style={s.statDivider} />
              <Pressable
                style={s.statItem}
                android_ripple={null}
                onPress={() => router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type: 'following', name: encodeURIComponent(profile.name ?? ''), vibersCount: profile.vibers_count ?? 0, vibingCount: profile.vibing_count ?? 0 } } as any)}
              >
                <Text style={s.statValue}>{profile.vibing_count ?? 0}</Text>
                <Text style={s.statLabel}>Vibing</Text>
              </Pressable>
            </View>
          )}

          {/* Vybe status badge */}
          {isConnected && (
            <View style={[s.statusBadge, s.statusBadgeConnected]}>
              <Text style={s.statusBadgeText}>✓ Connected</Text>
            </View>
          )}
          {isPending && !isConnected && (
            <View style={[s.statusBadge, s.statusBadgePending]}>
              <Text style={s.statusBadgeText}>Vybe Pending</Text>
            </View>
          )}

          {/* Blocked overlay */}
          {blockedByMe && (
            <View style={s.blockedOverlay}>
              <View style={s.blockedIconWrap}>
                <Ban size={36} color={Colors.inkSecondary} strokeWidth={1.5} />
              </View>
              <Text style={s.blockedTitle}>You've blocked this account</Text>
              <Text style={s.blockedSub}>Unblock to see their profile and content</Text>
              <Pressable style={s.unblockBtn} onPress={() => { hSuccess(); handleUnblock() }}>
                <Text style={s.unblockBtnText}>Unblock</Text>
              </Pressable>
            </View>
          )}

          {/* Bio */}
          {!blockedByMe && profile.bio ? (
            <Text style={s.bio}>{profile.bio}</Text>
          ) : null}

          {/* Details (Badges & Interests) */}
          {!blockedByMe && ((profile.badges?.length ?? 0) > 0 || (profile.interests?.length ?? 0) > 0) && (
            <View style={s.chipsRow}>
              {profile.badges?.map(badge => {
                const icon = HOST_BADGES[badge]
                return (
                  <View key={badge} style={s.badgeChip}>
                    {icon && <Text style={{ fontSize: 14, marginRight: 4 }}>{icon}</Text>}
                    <Text style={s.badgeText}>{badge}</Text>
                  </View>
                )
              })}
              {profile.interests?.map(tag => (
                <InterestChip key={tag} label={tag} emoji="" selected onPress={() => {}} />
              ))}
            </View>
          )}

          {/* Voice intro */}
          {!blockedByMe && profile.voice_url ? (
            <View style={s.voiceWrap}>
              <Pressable
                onPress={() => {
                  hTap()
                  if (voiceStatus.playing) { voicePlayer.pause() } else { voicePlayer.seekTo(0); voicePlayer.play() }
                }}
                style={s.voicePlayBtn}
                android_ripple={null}
              >
                {voiceStatus.playing
                  ? <Pause size={15} color={Colors.background} strokeWidth={2.5} />
                  : <Play  size={15} color={Colors.background} strokeWidth={2.5} />}
              </Pressable>
              <PlaybackWave isActive={voiceStatus.playing} compact />
            </View>
          ) : null}

          {/* Events Tabs */}
          {!blockedByMe && (profile.events_attending?.length > 0 || profile.events_hosted?.length > 0) && (
            <View style={s.eventsSection}>
              <TabSwitcher 
                tabs={['Going to', 'Hosted']}
                activeTab={activeTab === 'going' ? 'Going to' : 'Hosted'}
                onChange={(tab) => setActiveTab(tab === 'Going to' ? 'going' : 'hosted')}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.eventsList}>
                {activeTab === 'going' && profile.events_attending?.length === 0 && (
                  <Text style={s.emptyEventsText}>Not going to any upcoming events.</Text>
                )}
                {activeTab === 'hosted' && profile.events_hosted?.length === 0 && (
                  <Text style={s.emptyEventsText}>Not hosting any upcoming events.</Text>
                )}
                
                {activeTab === 'going' && profile.events_attending?.slice(0, 3).map(item => (
                  <SmallEventCard key={item.id} event={item} />
                ))}
                
                {activeTab === 'hosted' && profile.events_hosted?.slice(0, 3).map(item => (
                  <SmallEventCard key={item.id} event={item} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTAs — hidden when blocked */}
      {!blockedByMe && <View style={[s.ctaBar, { paddingBottom: insets.bottom + 8 }]}>
        {isConnected ? (
          <Pressable
            style={[s.ctaBtn, s.ctaBtnPrimary, { flex: 1 }]}
            onPress={() => {
              if (profile.conversation_id) {
                router.push(`/(chat)/${profile.conversation_id}` as any)
              } else {
                showPill('Send them a vybe first to start chatting', 'error')
              }
            }}
          >
            <MessageCircle size={18} color="#111" strokeWidth={2} />
            <Text style={s.ctaBtnPrimaryText}>Message</Text>
          </Pressable>
        ) : theySentVybe ? (
          <Pressable
            style={[s.ctaBtn, s.ctaBtnPrimary, { flex: 1.6 }]}
            onPress={() => { hSuccess(); setAcceptModalOpen(true) }}
          >
            <Check size={18} color="#111" strokeWidth={2.5} />
            <Text style={s.ctaBtnPrimaryText}>Accept Vybe</Text>
          </Pressable>
        ) : isPending ? (
          <Pressable style={[s.ctaBtn, s.ctaBtnPending]} disabled>
            <Flame size={18} color={Colors.brandOrange} fill="transparent" strokeWidth={1.8} />
            <Text style={s.ctaBtnPendingText}>Vybe Sent</Text>
          </Pressable>
        ) : isCooldown ? (
          <CooldownPill
            cooldownUntil={profile.cooldown_until!}
            onExpiredPress={() => { hMedium(); setVybeModalOpen(true) }}
          />
        ) : (
          <Pressable
            style={[s.ctaBtn, s.ctaBtnPrimary]}
            onPress={() => { hMedium(); setVybeModalOpen(true) }}
          >
            <Flame size={18} color="#111" fill="#111" strokeWidth={2} />
            <Text style={s.ctaBtnPrimaryText}>Send Vybe</Text>
          </Pressable>
        )}

        <Pressable
          style={[s.ctaBtn, s.ctaBtnSecondary, following && s.ctaBtnFollowing]}
          onPress={() => { hTap(); handleFollowToggle() }}
        >
          {following
            ? <UserCheck size={18} color={Colors.brandOrange} strokeWidth={1.8} />
            : <UserPlus size={18} color={Colors.inkPrimary} strokeWidth={1.8} />}
          <Text style={[s.ctaBtnSecondaryText, following && s.ctaBtnFollowingText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>}

      <VybeRequestModal
        visible={vybeModalOpen}
        user={{
          id: profile.id,
          name: profile.name,
          username: profile.username ?? null,
          gender: profile.gender,
          age: (profile as any).age ?? 0,
          bio: profile.bio,
          city: profile.city,
          interests: profile.interests,
          voice_url: profile.voice_url,
          distance_km: null,
          match_pct: 0,
          photos: profile.photos,
        }}
        onSend={handleSendVybe}
        onClose={() => setVybeModalOpen(false)}
      />

      <VybeIcebreakerModal
        visible={acceptModalOpen}
        partnerName={profile.name}
        onSend={handleAcceptVybe}
        onClose={() => setAcceptModalOpen(false)}
      />

      <ProfileMenuSheet
        visible={menuOpen}
        userId={profile.id}
        username={profile.username ?? null}
        targetName={profile.name ?? null}
        avatarUrl={photos[0]?.url ?? null}
        city={profile.city}
        interests={profile.interests}
        isBlocked={blockedByMe}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onReport={handleReport}
        onClose={() => setMenuOpen(false)}
      />

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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkSecondary, marginBottom: 12 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange },
  deletedIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  deletedTitle: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkSecondary, marginBottom: 10 },
  deletedBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkDisabled, textAlign: 'center', lineHeight: 21 },

  // Header overlay
  headerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerCircleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Photos
  photoFallback: {
    width: W, height: W * 1.2,
    backgroundColor: '#1a1a1a',
    alignItems: 'center', justifyContent: 'center',
  },
  photoFallbackInitial: { fontFamily: FontFamily.headingBold, fontSize: 96, color: Colors.inkSecondary },
  photoDots: {
    position: 'absolute', bottom: 12,
    flexDirection: 'row', alignSelf: 'center', gap: 6,
  },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  photoDotActive: { backgroundColor: '#fff', width: 16 },

  // Blocked overlay
  blockedOverlay: {
    alignItems: 'center', paddingVertical: 32, gap: 10,
  },
  blockedIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  blockedTitle: {
    fontFamily: FontFamily.headingBold, fontSize: 18,
    color: Colors.inkPrimary, textAlign: 'center',
  },
  blockedSub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.inkSecondary, textAlign: 'center',
  },
  unblockBtn: {
    marginTop: 8,
    paddingHorizontal: 28, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.brandOrange,
  },
  unblockBtnText: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange,
  },

  // Body
  body: { padding: 20, gap: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  name: { fontFamily: FontFamily.headingBold, fontSize: 26, color: Colors.inkPrimary, flex: 1 },
  mutual: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.brandOrange, marginTop: -6 },
  city: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginTop: -10 },

  // Stats
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 0 },
  statItem: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 6 },
  statValue: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  statLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.divider },

  // Status badge
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  statusBadgeConnected: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.12)' },
  statusBadgePending: { borderColor: Colors.brandOrange, backgroundColor: 'rgba(255,107,53,0.12)' },
  statusBadgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },

  // Bio
  bio: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, lineHeight: 22 },

  // Chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  voiceWrap: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  voicePlayBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },

  // Events
  eventsSection: { gap: 12, marginTop: 8 },
  eventsList: { gap: 12, paddingRight: 24 },
  emptyEventsText: { 
    fontFamily: FontFamily.bodyRegular, 
    fontSize: 14, 
    color: Colors.inkSecondary, 
    textAlign: 'center', 
    marginVertical: 20 
  },

  // CTAs
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  ctaBtn: {
    height: 52, borderRadius: 26,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaBtnPrimary: { flex: 1.6, backgroundColor: Colors.brandOrange },
  ctaBtnPrimaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: '#111' },
  ctaBtnSecondary: {
    flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
  },
  ctaBtnSecondaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  ctaBtnPending: {
    flex: 1.6, borderWidth: 1.5, borderColor: Colors.brandOrange,
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  ctaBtnPendingText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.brandOrange },
  ctaBtnDisabled: { opacity: 0.5, backgroundColor: '#333' },
  ctaBtnFollowing: { borderColor: Colors.brandOrange },
  ctaBtnFollowingText: { color: Colors.brandOrange },
})
