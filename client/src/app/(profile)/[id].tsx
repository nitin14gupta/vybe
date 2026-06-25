import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  FlatList, ActivityIndicator, Dimensions,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { hTap, hMedium, hSuccess } from '@/lib/haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft, MoreVertical, Flame, UserPlus, UserCheck,
  MessageCircle, Ban, Play, Pause, Check,
} from 'lucide-react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { VybeRequestModal, VybeIcebreakerModal, PlaybackWave, ProfileMenuSheet } from '@/components/ui'
import ApiService, { ExtendedProfile, EventSummary } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { useVybeStore } from '@/store/vybeStore'
import { useImageViewer } from '@/hooks/useImageViewer'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'

const { width: W } = Dimensions.get('window')

// ── Mini event card ───────────────────────────────────────────────────────────

function EventChip({ event }: { event: EventSummary }) {
  return (
    <Pressable
      style={s.eventChip}
      onPress={() => { hTap(); router.push(`/(events)/${event.id}` as any) }}
    >
      {event.cover_photos?.[0]?.url ? (
        <Image source={{ uri: event.cover_photos[0].url }} style={s.eventChipImg} />
      ) : (
        <View style={[s.eventChipImg, s.eventChipImgFallback]}>
          <Text style={{ fontSize: 24 }}>🎉</Text>
        </View>
      )}
      <Text style={s.eventChipTitle} numberOfLines={2}>{event.title}</Text>
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
    } catch {
      setVybeSent(false)
      markCleared(profile.id)
    }
  }

  const handleAcceptVybe = async (icebreaker: string) => {
    if (!profile?.vybe_id) return
    setAcceptModalOpen(false)
    try {
      const result = await ApiService.respondToVybe(profile.vybe_id, 'accept', icebreaker)
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
        <ActivityIndicator size="large" color={Colors.brandOrange} />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.errorText}>Profile not found</Text>
        <Pressable onPress={() => { hTap(); router.back() }} style={s.backBtn}>
          <Text style={s.backBtnText}>← Go back</Text>
        </Pressable>
      </View>
    )
  }

  const photos = profile.photos ?? []
  const isConnected = profile.vybe_status === 'connected'
  const isPending = vybeSent || (profile.vybe_status === 'pending' && !!profile.vybe_sent_by_me)
  const theySentVybe = profile.vybe_status === 'pending' && !profile.vybe_sent_by_me && !vybeSent
  const age = profile.dob
    ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / 3.156e10)
    : profile.age

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      {/* Header overlay */}
      <View style={[s.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => { hTap(); router.back() }} style={s.headerCircleBtn} hitSlop={8}>
          <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
        </Pressable>
        <Pressable onPress={() => { hTap(); setMenuOpen(true) }} style={s.headerCircleBtn} hitSlop={8}>
          <MoreVertical size={20} color="#fff" strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
              renderItem={({ item }) => (
                <Pressable onLongPress={() => openMedia(item.url, 'image')} delayLongPress={400}>
                  <Image source={{ uri: item.url }} style={{ width: W, height: W * 1.2 }} resizeMode="cover" />
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
            <Text style={s.name}>
              {profile.name ?? 'User'}{age ? `, ${age}` : ''}
            </Text>
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
                onPress={() => { hTap(); router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type: 'followers', name: encodeURIComponent(profile.name ?? ''), vibersCount: profile.vibers_count ?? 0, vibingCount: profile.vibing_count ?? 0 } } as any) }}
              >
                <Text style={s.statValue}>{profile.vibers_count ?? 0}</Text>
                <Text style={s.statLabel}>Vibers</Text>
              </Pressable>
              <View style={s.statDivider} />
              <Pressable
                style={s.statItem}
                android_ripple={null}
                onPress={() => { hTap(); router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type: 'following', name: encodeURIComponent(profile.name ?? ''), vibersCount: profile.vibers_count ?? 0, vibingCount: profile.vibing_count ?? 0 } } as any) }}
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

          {/* Interests */}
          {!blockedByMe && profile.interests?.length > 0 && (
            <View style={s.chipsRow}>
              {profile.interests.map(tag => (
                <View key={tag} style={s.chip}>
                  <Text style={s.chipText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Voice intro */}
          {!blockedByMe && profile.voice_url ? (
            <View style={s.voiceWrap}>
              <Pressable
                onPress={() => { hTap(); voiceStatus.playing ? voicePlayer.pause() : voicePlayer.play() }}
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

          {/* Events attending */}
          {!blockedByMe && profile.events_attending?.length > 0 && (
            <View style={s.eventsSection}>
              <Text style={s.sectionLabel}>Going to</Text>
              <FlatList
                data={profile.events_attending}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={e => e.id}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => <EventChip event={item} />}
              />
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
              hTap()
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
          age: profile.age,
          gender: profile.gender,
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
        username={profile.username ?? null}
        targetName={profile.name ?? null}
        isBlocked={blockedByMe}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onReport={handleReport}
        onClose={() => setMenuOpen(false)}
      />

      {viewingMedia && (
        <MediaViewerModal
          visible={!!viewingMedia}
          url={viewingMedia.url}
          type={viewingMedia.type}
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
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkPrimary },

  // Voice
  voiceWrap: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  voicePlayBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },

  // Events
  eventsSection: { gap: 10 },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 12,
    color: Colors.inkSecondary, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  eventChip: {
    width: 130, borderRadius: 14,
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  eventChipImg: { width: '100%', height: 80 },
  eventChipImgFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  eventChipTitle: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkPrimary,
    padding: 8, lineHeight: 16,
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
