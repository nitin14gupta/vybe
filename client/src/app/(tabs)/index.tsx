import { forwardRef, useImperativeHandle, useRef, useCallback, useState } from 'react'
import {
  BackHandler, View, Text, StyleSheet, Pressable, Image, Dimensions, ActivityIndicator,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withSequence, runOnJS,
  FadeIn, FadeOut,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, router } from 'expo-router'
import { X, Flame, Star, SlidersHorizontal, MapPin, Mic, Pause, Search, Bell } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn, PlaybackWave, VybeRequestModal } from '@/components/ui'
import { FilterSheet } from '@/components/ui/FilterSheet'
import { useDiscover, type DiscoverFilters } from '@/hooks/useDiscover'
import { useCardAudio } from '@/hooks/useCardAudio'
import type { DiscoverUser } from '@/api/apiService'
import ApiService from '@/api/apiService'
import { useNotifStore } from '@/store/notifStore'
import { Colors, FontFamily, Radius } from '@/constants'

const { width, height } = Dimensions.get('window')
const SWIPE_THRESHOLD = width * 0.33
const CARD_H = height * 0.68

// ── SwipeCard ─────────────────────────────────────────────────────────────────

type SwipeCardRef = { swipeLeft: () => void; swipeRight: () => void; swipeStar: () => void }
type SwipeCardProps = {
  user: DiscoverUser
  onSwipe: (dir: 'left' | 'right') => void
}

const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(function SwipeCard(
  { user, onSwipe },
  ref,
) {
  const tx = useSharedValue(0)
  const ty = useSharedValue(0)

  const { isPlaying, hasAudio, toggle: toggleAudio, stop: stopAudio } = useCardAudio(user.voice_url)

  const triggerSwipe = useCallback(
    (dir: 'left' | 'right') => {
      stopAudio()
      const target = dir === 'right' ? width * 1.6 : -width * 1.6
      tx.value = withTiming(target, { duration: 300 }, () => {
        runOnJS(onSwipe)(dir)
      })
    },
    [onSwipe, stopAudio],
  )

  useImperativeHandle(ref, () => ({
    swipeLeft: () => triggerSwipe('left'),
    swipeRight: () => triggerSwipe('right'),
    swipeStar: () => triggerSwipe('right'),
  }))

  const gesture = Gesture.Pan()
    .onUpdate(e => {
      tx.value = e.translationX
      ty.value = e.translationY * 0.12
    })
    .onEnd(e => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(stopAudio)()
        const target = width * 1.6
        tx.value = withTiming(target, { duration: 300 }, () => runOnJS(onSwipe)('right'))
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(stopAudio)()
        const target = -width * 1.6
        tx.value = withTiming(target, { duration: 300 }, () => runOnJS(onSwipe)('left'))
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 130 })
        ty.value = withSpring(0, { damping: 18, stiffness: 130 })
      }
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${(tx.value / width) * 11}deg` },
    ],
  }))

  const vibeOverlay = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min((tx.value - 28) / 70, 1)),
  }))
  const passOverlay = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min((-tx.value - 28) / 70, 1)),
  }))

  const photo = user.photos[0]?.url
  const chips = user.interests.slice(0, 3)

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Full-bleed photo */}
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.photoFallback]}>
            <Text style={styles.photoFallbackText}>{(user.name ?? '?').charAt(0)}</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.94)']}
          locations={[0, 0.38, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* VYBE stamp overlay */}
        <Animated.View style={[styles.vibeStamp, vibeOverlay]}>
          <Text style={styles.vibeStampText}>🔥 VYBE IT!</Text>
        </Animated.View>

        {/* PASS stamp overlay */}
        <Animated.View style={[styles.passStamp, passOverlay]}>
          <Text style={styles.passStampText}>✕ PASS</Text>
        </Animated.View>

        {/* VIBE MATCH badge — top left */}
        {user.match_pct > 0 && (
          <LinearGradient
            colors={[Colors.brandOrange, Colors.brandCoral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.matchBadge}
          >
            <Text style={styles.matchLabel}>VIBE MATCH</Text>
            <Text style={styles.matchPct}>{user.match_pct}%</Text>
          </LinearGradient>
        )}

        {/* Voice intro button — top right (shown only when voice exists) */}
        {hasAudio && (
          <Pressable onPress={toggleAudio} style={styles.voiceBtn}>
            {isPlaying ? (
              <>
                <Pause size={14} color="#fff" strokeWidth={2.5} />
                <View style={styles.voiceWaveWrap}>
                  <PlaybackWave isActive compact />
                </View>
              </>
            ) : (
              <Mic size={16} color="#fff" strokeWidth={2} />
            )}
          </Pressable>
        )}

        {/* Interest chips — below match badge on top-right (shifted down when voice btn present) */}
        {chips.length > 0 && (
          <View style={[styles.chipsWrap, hasAudio && styles.chipsWrapWithVoice]}>
            {chips.map(tag => (
              <View key={tag} style={styles.chip}>
                <Text style={styles.chipText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Glass info card */}
        <View style={styles.glassCard}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {user.name ?? 'Unknown'}{user.age ? `, ${user.age}` : ''}
            </Text>
          </View>
          {user.username ? (
            <Text style={styles.usernameText}>@{user.username}</Text>
          ) : null}
          {(user.city || user.distance_km != null) && (
            <View style={styles.locationRow}>
              <MapPin size={12} color="rgba(255,255,255,0.55)" strokeWidth={2} />
              <Text style={styles.locationText}>
                {user.city ?? ''}
                {user.distance_km != null ? ` • ${user.distance_km} km away` : ''}
              </Text>
            </View>
          )}
          {user.bio ? (
            <Text style={styles.bioText} numberOfLines={2}>{user.bio}</Text>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  )
})

// ── DiscoverScreen ────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [showExitPill, setShowExitPill] = useState(false)
  const [vybeSentPill, setVybeSentPill] = useState(false)
  const lastBackRef = useRef(0)
  const flameScale = useSharedValue(1)
  const flameAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: flameScale.value }] }))
  const { unreadCount, setUnreadCount } = useNotifStore()

  const {
    loading, error, hasMore,
    activeUser, nextUser, backUser,
    handlePass, handleVybe, handleFollow, handleStar,
    pendingVybe, sendVybe, dismissVybe,
    currentIdx, reload, filters, setFilters,
  } = useDiscover()

  const cardRef = useRef<SwipeCardRef>(null)

  // Fetch unread notification count on focus
  useFocusEffect(
    useCallback(() => {
      ApiService.getUnreadNotificationCount()
        .then(setUnreadCount)
        .catch(() => {})
    }, [setUnreadCount]),
  )

  // Stop audio when tab loses focus + double-back to exit
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now()
        if (now - lastBackRef.current < 2000) {
          BackHandler.exitApp()
          return true
        }
        lastBackRef.current = now
        setShowExitPill(true)
        setTimeout(() => setShowExitPill(false), 2000)
        return true
      })
      return () => {
        sub.remove()
        setShowExitPill(false)
      }
    }, []),
  )

  const onSwipe = useCallback(
    (dir: 'left' | 'right') => {
      if (dir === 'right') handleFollow(activeUser?.id ?? '')
      else handlePass(activeUser?.id ?? '')
    },
    [activeUser, handleFollow, handlePass],
  )

  const onVybePress = useCallback(() => {
    if (!activeUser) return
    // Bounce the flame button
    flameScale.value = withSequence(
      withSpring(1.45, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 6, stiffness: 300 }),
    )
    handleVybe(activeUser)
  }, [activeUser, handleVybe, flameScale])

  const handleSendVybe = useCallback((message: string) => {
    sendVybe(message)
    setVybeSentPill(true)
    setTimeout(() => setVybeSentPill(false), 2500)
  }, [sendVybe])

  return (
    <View style={styles.root}>
      <AppHeader
        showLogo
        leftAction={
          <HeaderIconBtn>
            <View style={styles.menuDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </HeaderIconBtn>
        }
        rightAction={
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <HeaderIconBtn onPress={() => router.push('/(settings)/notifications' as any)}>
              <View>
                <Bell size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
                {unreadCount > 0 && <View style={styles.bellDot} />}
              </View>
            </HeaderIconBtn>
            <HeaderIconBtn onPress={() => router.push('/(search)/' as any)}>
              <Search size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
            </HeaderIconBtn>
            <HeaderIconBtn onPress={() => setFilterOpen(true)}>
              <SlidersHorizontal size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
            </HeaderIconBtn>
          </View>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brandOrange} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Couldn't load feed</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <Pressable onPress={reload} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : !hasMore ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>You've seen everyone! 🎉</Text>
          <Text style={styles.emptySub}>Check back later for new vybes</Text>
          <Pressable onPress={reload} style={styles.retryBtn}>
            <Text style={styles.retryText}>Refresh</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.arena}>
          {/* Back card (depth 2) */}
          {backUser && (
            <View style={[styles.card, styles.backCard2]}>
              {backUser.photos[0]?.url && (
                <Image source={{ uri: backUser.photos[0].url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          {/* Middle card (depth 1) */}
          {nextUser && (
            <View style={[styles.card, styles.backCard1]}>
              {nextUser.photos[0]?.url && (
                <Image source={{ uri: nextUser.photos[0].url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          {/* Active swipeable card */}
          {activeUser && (
            <SwipeCard
              key={currentIdx}
              ref={cardRef}
              user={activeUser}
              onSwipe={onSwipe}
            />
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {/* Pass (X) */}
            <Pressable
              onPress={() => {
                handlePass(activeUser?.id ?? '')
                cardRef.current?.swipeLeft()
              }}
              style={[styles.actionBtn, styles.passBtn]}
            >
              <X size={26} color="#FF5252" strokeWidth={2.5} />
            </Pressable>

            {/* Vybe (fire) */}
            <Animated.View style={flameAnimStyle}>
              <Pressable
                onPress={onVybePress}
                style={[styles.actionBtn, styles.vibeBtn]}
              >
                <Flame size={30} color={Colors.background} strokeWidth={2} fill={Colors.background} />
              </Pressable>
            </Animated.View>

            {/* Star / Follow */}
            <Pressable
              onPress={() => {
                handleStar(activeUser?.id ?? '')
                cardRef.current?.swipeStar()
              }}
              style={[styles.actionBtn, styles.starBtn]}
            >
              <Star size={24} color={Colors.accentGold} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      )}

      <FilterSheet
        visible={filterOpen}
        filters={filters}
        onApply={f => { setFilters(f); setFilterOpen(false) }}
        onClose={() => setFilterOpen(false)}
      />

      <VybeRequestModal
        visible={!!pendingVybe}
        user={pendingVybe}
        onSend={handleSendVybe}
        onClose={dismissVybe}
      />

      {/* Vybe sent confirmation pill */}
      {vybeSentPill && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(300)}
          style={styles.vybeSentPill}
          pointerEvents="none"
        >
          <Text style={styles.vybeSentText}>Vybe sent 🔥</Text>
        </Animated.View>
      )}

      {/* Double-back exit hint */}
      {showExitPill && (
        <View style={styles.exitPill} pointerEvents="none">
          <Text style={styles.exitPillText}>Press back again to exit</Text>
        </View>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  vybeSentPill: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,107,53,0.92)',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 11,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  vybeSentText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: '#111',
  },
  exitPill: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: 'rgba(20,20,20,0.92)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exitPillText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.1,
  },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, textAlign: 'center' },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.brandOrange,
  },
  retryText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },

  arena: { flex: 1, position: 'relative' },

  card: {
    position: 'absolute',
    top: 4,
    left: 12,
    right: 12,
    height: CARD_H,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  backCard2: {
    transform: [{ scale: 0.88 }, { translateY: 22 }],
    opacity: 0.45,
  },
  backCard1: {
    transform: [{ scale: 0.94 }, { translateY: 10 }],
    opacity: 0.72,
  },

  photoFallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 72,
    color: Colors.inkDisabled,
  },

  vibeStamp: {
    position: 'absolute',
    top: 48,
    left: 24,
    backgroundColor: Colors.brandOrange,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
    transform: [{ rotate: '-8deg' }],
    zIndex: 10,
  },
  vibeStampText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.background,
    letterSpacing: 0.5,
  },
  passStamp: {
    position: 'absolute',
    top: 48,
    right: 24,
    backgroundColor: '#FF3838',
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 8,
    transform: [{ rotate: '8deg' }],
    zIndex: 10,
  },
  passStampText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.background,
    letterSpacing: 0.5,
  },

  matchBadge: {
    position: 'absolute',
    top: 20,
    left: 18,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  matchLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.background,
    textTransform: 'uppercase',
  },
  matchPct: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.background,
    lineHeight: 22,
  },

  // Voice intro button (top-right)
  voiceBtn: {
    position: 'absolute',
    top: 20,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 6,
  },
  voiceWaveWrap: {
    width: 36,
    height: 16,
    overflow: 'hidden',
  },

  chipsWrap: {
    position: 'absolute',
    top: 80,
    right: 14,
    gap: 6,
    alignItems: 'flex-end',
    zIndex: 5,
    maxWidth: '55%',
  },
  chipsWrapWithVoice: {
    top: 68,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.1,
  },

  glassCard: {
    position: 'absolute',
    bottom: 14,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(13,13,13,0.62)',
    borderRadius: 24,
    padding: 18,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: '#F5F0EB',
    letterSpacing: -0.3,
  },
  usernameText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: 'rgba(255,107,53,0.85)',
    marginTop: -2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
  },
  bioText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 18,
    marginTop: 2,
  },

  actions: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    zIndex: 20,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  passBtn: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,82,82,0.35)',
  },
  vibeBtn: {
    width: 72,
    height: 72,
    backgroundColor: Colors.brandOrange,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 10,
  },
  starBtn: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,184,48,0.35)',
  },

  menuDots: { gap: 3, alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.inkSecondary },
  bellDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandOrange,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
})
