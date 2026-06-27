import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Clock, Users } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius, ComponentSize } from '@/constants'
import { PrimaryButton, OutlineButton, BackButton, ConfirmSheet } from '@/components/ui'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const BANNER_H = SCREEN_H * 0.48

// ── WaitlistBadge ─────────────────────────────────────────────────────────────

function WaitlistBadge({ position }: { position: number }) {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 950, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <View style={badge.wrap}>
      <Animated.View style={[badge.ring, { transform: [{ scale: pulse }] }]} />
      <LinearGradient
        colors={[Colors.brandOrange, Colors.brandCoral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={badge.circle}
      >
        <Text style={badge.num}>#{position}</Text>
      </LinearGradient>
    </View>
  )
}

const badge = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,53,0.25)',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 26,
    color: '#fff',
    letterSpacing: -0.5,
  },
})

// ── WaitlistInfoCard ──────────────────────────────────────────────────────────

function WaitlistInfoCard() {
  return (
    <View style={info.card}>
      <View style={info.row}>
        <Clock size={15} color={Colors.accentGold} strokeWidth={1.8} />
        <Text style={info.text}>
          You have{' '}
          <Text style={info.highlight}>24 hours</Text>
          {' '}to confirm once a spot opens for you
        </Text>
      </View>
      <View style={info.divider} />
      <View style={info.row}>
        <Users size={15} color={Colors.inkSecondary} strokeWidth={1.8} />
        <Text style={info.text}>
          We'll push-notify you the moment the spot is yours
        </Text>
      </View>
    </View>
  )
}

const info = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.elevated,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: Spacing.md,
    gap: 12,
    marginTop: Spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  text: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    lineHeight: 19,
  },
  highlight: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.accentGold,
  },
  divider: { height: 1, backgroundColor: Colors.divider },
})

// ── useLeaveWaitlist ──────────────────────────────────────────────────────────

function useLeaveWaitlist(id: string) {
  const [leaving, setLeaving] = useState(false)
  const showPill = usePillStore(s => s.show)
  const router = useRouter()

  const leave = async () => {
    setLeaving(true)
    try {
      await ApiService.rsvpEvent(id, 'cancel')
      showPill('Removed from waitlist', 'default')
      router.back()
    } catch {
      showPill("Couldn't leave waitlist, try again", 'error')
      setLeaving(false)
    }
  }

  return { leaving, leave }
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WaitlistJoinedScreen() {
  const { id, position, coverUrl, title } = useLocalSearchParams<{
    id: string
    position: string
    coverUrl: string
    title: string
  }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { leaving, leave } = useLeaveWaitlist(id!)
  const [confirmVisible, setConfirmVisible] = useState(false)

  const pos = parseInt(position ?? '1', 10)

  const cardY = useRef(new Animated.Value(24)).current
  const cardOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardY, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <View style={s.root}>
      {/* White status bar icons over the dark image */}
      <StatusBar style="light" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-bleed banner — goes behind status bar */}
        <View style={s.bannerWrap}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={s.bannerImg} contentFit="cover" />
          ) : (
            <View style={[s.bannerImg, s.bannerFallback]} />
          )}
          <LinearGradient
            colors={['transparent', Colors.background]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button sits over the banner, respects inset */}
          <View style={[s.backBtnWrap, { top: insets.top + 8 }]}>
            <BackButton onPress={() => router.back()} />
          </View>
        </View>

        {/* Card — full width, top rounded only, open at the bottom (IS the screen) */}
        <Animated.View
          style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}
        >
          <WaitlistBadge position={pos} />

          <Text style={s.heading}>You're on the{'\n'}waitlist</Text>
          {title ? (
            <Text style={s.eventTitle} numberOfLines={2}>{title}</Text>
          ) : null}

          {/* Position chip */}
          <View style={s.posChip}>
            <Users size={14} color={Colors.brandOrange} strokeWidth={1.8} />
            <Text style={s.posText}>
              Position{' '}
              <Text style={s.posNum}>#{pos}</Text>
              {' '}in queue
            </Text>
          </View>

          <WaitlistInfoCard />

          {/* Actions inside the open card */}
          <View style={s.actions}>
            <OutlineButton
              label="Leave Waitlist"
              onPress={() => setConfirmVisible(true)}
              style={s.leaveBtn}
            />
            <PrimaryButton
              label="Back to Event"
              onPress={() => router.back()}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Confirmation sheet — Gorhom bottom sheet, already in the project */}
      <ConfirmSheet
        visible={confirmVisible}
        title="Leave Waitlist?"
        body="You'll lose your spot and won't be notified if one opens up. You can rejoin, but you'll go to the back of the queue."
        confirmLabel="Yes, Leave"
        destructive
        onConfirm={leave}
        onClose={() => setConfirmVisible(false)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },

  // Banner starts at y=0, behind status bar (no top padding on root)
  bannerWrap: {
    width: SCREEN_W,
    height: BANNER_H,
    overflow: 'hidden',
  },
  bannerImg: { width: '100%', height: '100%' },
  bannerFallback: { backgroundColor: Colors.surface },
  backBtnWrap: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },

  // Full-width card — open at bottom, IS the screen surface
  card: {
    marginTop: -48,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.divider,
  },

  heading: {
    fontFamily: FontFamily.headingBold,
    fontSize: 30,
    letterSpacing: -0.6,
    color: Colors.inkPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: Spacing.xs,
  },
  eventTitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },

  posChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.22)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  posText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  posNum: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.brandOrange,
  },

  actions: {
    width: '100%',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  leaveBtn: {
    borderColor: 'rgba(255,56,100,0.35)',
  },
})
