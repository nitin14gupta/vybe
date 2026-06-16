import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, Pressable, Image, Dimensions, ActivityIndicator,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { X, Flame, Star, SlidersHorizontal, MapPin } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn } from '@/components/ui'
import { useDiscover } from '@/hooks/useDiscover'
import type { DiscoverUser } from '@/api/apiService'
import { Colors, FontFamily, Radius } from '@/constants'

const { width, height } = Dimensions.get('window')
const SWIPE_THRESHOLD = width * 0.33
const CARD_H = height * 0.68

// ── SwipeCard ─────────────────────────────────────────────────────────────────

type SwipeCardRef = { swipeLeft: () => void; swipeRight: () => void; swipeStar: () => void }
type SwipeCardProps = { user: DiscoverUser; onSwipe: (dir: 'left' | 'right') => void }

const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(function SwipeCard(
  { user, onSwipe },
  ref,
) {
  const tx = useSharedValue(0)
  const ty = useSharedValue(0)

  const triggerSwipe = useCallback(
    (dir: 'left' | 'right') => {
      const target = dir === 'right' ? width * 1.6 : -width * 1.6
      tx.value = withTiming(target, { duration: 300 }, () => {
        runOnJS(onSwipe)(dir)
      })
    },
    [onSwipe],
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
        const target = width * 1.6
        tx.value = withTiming(target, { duration: 300 }, () => runOnJS(onSwipe)('right'))
      } else if (e.translationX < -SWIPE_THRESHOLD) {
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

        {/* VYBE overlay */}
        <Animated.View style={[styles.vibeStamp, vibeOverlay]}>
          <Text style={styles.vibeStampText}>🔥 VYBE IT!</Text>
        </Animated.View>

        {/* PASS overlay */}
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

        {/* Interest chips — top area */}
        {chips.length > 0 && (
          <View style={styles.chipsWrap}>
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
  const {
    loading, error, hasMore,
    activeUser, nextUser, backUser,
    handlePass, handleVybe, handleStar,
    currentIdx, reload,
  } = useDiscover()

  const cardRef = useRef<SwipeCardRef>(null)

  const onSwipe = useCallback(
    (dir: 'left' | 'right') => {
      if (dir === 'right') handleVybe(activeUser?.id ?? '')
      else handlePass()
    },
    [activeUser, handleVybe, handlePass],
  )

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
          <HeaderIconBtn>
            <SlidersHorizontal size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
          </HeaderIconBtn>
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
            <Pressable
              onPress={() => cardRef.current?.swipeLeft()}
              style={[styles.actionBtn, styles.passBtn]}
            >
              <X size={26} color="#FF5252" strokeWidth={2.5} />
            </Pressable>

            <Pressable
              onPress={() => cardRef.current?.swipeRight()}
              style={[styles.actionBtn, styles.vibeBtn]}
            >
              <Flame size={30} color={Colors.background} strokeWidth={2} fill={Colors.background} />
            </Pressable>

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
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, textAlign: 'center' },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.brandOrange,
  },
  retryText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },

  // Card arena
  arena: { flex: 1, position: 'relative' },

  // Base card shape
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

  // Background depth cards
  backCard2: {
    transform: [{ scale: 0.88 }, { translateY: 22 }],
    opacity: 0.45,
  },
  backCard1: {
    transform: [{ scale: 0.94 }, { translateY: 10 }],
    opacity: 0.72,
  },

  // Photo fallback
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

  // Swipe stamps
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

  // VIBE MATCH badge
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

  // Interest chips
  chipsWrap: {
    position: 'absolute',
    top: 20,
    right: 14,
    gap: 6,
    alignItems: 'flex-end',
    zIndex: 5,
    maxWidth: '55%',
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

  // Glass info card
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

  // Action buttons
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

  // Menu dots
  menuDots: { gap: 3, alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.inkSecondary },
})
