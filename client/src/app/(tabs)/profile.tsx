import { useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, Dimensions, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { MapPin, Play, Pause, Pencil, Settings } from 'lucide-react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { InterestChip, PlaybackWave, AppHeader, HeaderIconBtn } from '@/components/ui'
import { useProfile } from '@/hooks/useProfile'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

const { width } = Dimensions.get('window')
const GRID_GAP = 2
const PHOTO_SIZE = (width - GRID_GAP * 2) / 3

const GENDER_DISPLAY: Record<string, string> = {
  Man: 'Male',
  Woman: 'Female',
  'Non-binary': 'Non-binary',
  'Prefer not to say': '—',
}

export default function ProfileScreen() {
  const { profile, loading, error, refresh } = useProfile()

  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  useEffect(() => {
    if (profile?.voice_url) player.replace({ uri: profile.voice_url })
  }, [profile?.voice_url])

  const toggleVoice = () => {
    if (status.playing) { player.pause() } else { player.seekTo(0); player.play() }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.brandOrange} />
      </View>
    )
  }

  if (error || !profile) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: Colors.inkSecondary, fontFamily: FontFamily.bodyRegular, fontSize: 14, marginBottom: 16 }}>
          {error ?? 'Could not load profile'}
        </Text>
        <Pressable onPress={refresh} style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: Colors.brandOrange }}>
          <Text style={{ color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 14 }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  const name    = profile?.name ?? '—'
  const gender  = profile?.gender ? GENDER_DISPLAY[profile.gender] ?? profile.gender : null
  const city    = profile?.city ?? null
  const bio     = profile?.bio ?? null
  const badges  = profile?.badges ?? []
  const vibers  = profile?.vibers_count ?? 0
  const vibing  = profile?.vibing_count ?? 0
  const posts   = profile?.photos?.length ?? 0

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Main profile card ──────────────────────────────── */}
        <View style={styles.card}>

          {/* Avatar row */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarRing}>
              {profile?.photos?.[0]?.url ? (
                <Image source={{ uri: profile.photos[0].url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View style={styles.nameCol}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              <View style={styles.pillsRow}>
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
          </View>

          {/* Bio */}
          {bio ? (
            <Text style={styles.bio} numberOfLines={3}>{bio}</Text>
          ) : null}

          {/* Edit button */}
          <Pressable
            onPress={() => router.push('/(profile)/edit')}
            style={styles.editBtn}
          >
            <Pencil size={13} color={Colors.brandOrange} strokeWidth={2} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
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

          {/* Divider */}
          {(badges.length > 0 || (profile?.interests?.length ?? 0) > 0) && (
            <View style={styles.divider} />
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <View style={styles.chipSection}>
              <Text style={styles.chipLabel}>Badges</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {badges.map(badge => (
                  <View key={badge} style={styles.badgeChip}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Interests */}
          {(profile?.interests?.length ?? 0) > 0 && (
            <View style={[styles.chipSection, { marginTop: badges.length > 0 ? 12 : 0 }]}>
              <Text style={styles.chipLabel}>Interests</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {profile!.interests.map(tag => (
                  <InterestChip key={tag} label={tag} emoji="" selected onPress={() => {}} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── Voice intro card ──────────────────────────────── */}
        {profile?.voice_url ? (
          <View style={styles.voiceCard}>
            <Pressable onPress={toggleVoice} style={styles.voicePlayBtn}>
              {status.playing
                ? <Pause size={15} color={Colors.background} strokeWidth={2.5} />
                : <Play  size={15} color={Colors.background} strokeWidth={2.5} />
              }
            </Pressable>
            <View style={styles.voiceWave}>
              <PlaybackWave isActive={status.playing} compact />
            </View>
            <Text style={styles.voiceLabel}>Voice intro</Text>
          </View>
        ) : null}

        {/* ── Photo grid ────────────────────────────────────── */}
        {(profile?.photos?.length ?? 0) > 0 && (
          <View style={styles.grid}>
            {profile!.photos.map(photo => (
              <Image
                key={photo.id}
                source={{ uri: photo.url }}
                style={styles.gridPhoto}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
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

  // ── Main card ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.modal,
    marginHorizontal: Spacing.screenPadding,
    marginTop: 8,
    marginBottom: 10,
    padding: 16,
    overflow: 'hidden',
  },

  // Avatar row
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatarRing: {
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: Colors.brandOrange,
    padding: 2,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    color: Colors.inkPrimary,
  },
  nameCol: { flex: 1, gap: 6 },
  name: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    letterSpacing: -0.3,
  },
  pillsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },

  // Bio
  bio: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },

  // Edit button
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    marginBottom: 16,
  },
  editBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.brandOrange,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 14,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center', gap: 1 },
  statValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.brandOrange,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.inkPrimary,
  },
  statSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: Colors.inkDisabled,
  },
  statDivider: {
    width: 1, height: 36,
    backgroundColor: Colors.divider,
  },

  // Chips
  chipSection: {},
  chipLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.inkSecondary,
    marginBottom: 8,
  },
  chipsScroll: {
    gap: 6,
    flexDirection: 'row',
  },
  badgeChip: {
    backgroundColor: 'rgba(255,184,48,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,48,0.3)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.accentGold,
  },

  // Voice
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  voicePlayBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceWave: { flex: 1, overflow: 'hidden' },
  voiceLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
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
})
