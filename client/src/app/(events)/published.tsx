import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { hTap, hSuccess } from '@/lib/haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg'
import { Link2 } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'
import { ConfettiRain } from '@/components/ui'
import { usePillStore } from '@/store/pillStore'
import ApiService from '@/api/apiService'
import { EventShareCard } from '@/components/events/EventShareCard'
import { useImageShare } from '@/hooks/useImageShare'
import { buildEventShareUrl } from '@/lib/deepLink'
import LiquidPlasmaBackground from '@/components/LiquidPlasmaBackground'
import { BlurView } from 'expo-blur'

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}

function formatDateTime(iso: string | null | undefined) {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Social icons ──────────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <Path fill="#fff" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.657 1.438 5.168L2 22l4.978-1.405A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.33-1.284l-.31-.184-3.22.909.915-3.164-.202-.325A7.944 7.944 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" />
    </Svg>
  )
}

function InstagramIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Defs>
        <SvgGradient id="ig2" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#f09433" />
          <Stop offset="50%" stopColor="#dc2743" />
          <Stop offset="100%" stopColor="#bc1888" />
        </SvgGradient>
      </Defs>
      <Path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </Svg>
  )
}

// ── Pulsing rocket icon ───────────────────────────────────────────────────────

function RocketIcon() {
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={[s.rocketWrap, { transform: [{ translateY: floatAnim }] }]}>
      <BlurView intensity={40} tint="light" style={s.rocketCircle}>
        <Text style={s.rocketEmoji}>🚀</Text>
      </BlurView>
    </Animated.View>
  )
}

// ── Share button ──────────────────────────────────────────────────────────────

function ShareBtn({
  icon, label, onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <Pressable style={s.shareBtn} onPress={onPress}>
      <View style={s.shareBtnIcon}>{icon}</View>
      <Text style={s.shareBtnLabel}>{label}</Text>
    </Pressable>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PublishedScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)

  const eventTitle = decodeURIComponent(title ?? 'your event')

  const [coverUrl, setCoverUrl] = useState('')
  const [dateTimeLabel, setDateTimeLabel] = useState('')
  const shareCardRef = useRef<View>(null)
  const { shareImage } = useImageShare()

  useEffect(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setCoverUrl(ev.cover_photos?.[0]?.url ?? '')
        setDateTimeLabel(formatDateTime(ev.date_time))
      })
      .catch(() => { })
  }, [id])

  const shareText = `Check out "${eventTitle}" on VYBE! 🔥${dateTimeLabel ? `\n${dateTimeLabel}` : ''}`

  const handleShare = async () => {
    hTap()
    if (coverUrl) {
      const result = await shareImage(shareCardRef, { message: shareText, title: eventTitle })
      if (result.shared || result.error === 'cancelled') return
    }
    await Share.share({ message: shareText })
  }

  const shareWhatsApp = handleShare
  const shareInstagram = handleShare

  const copyLink = () => {
    hTap()
    Share.share({ message: buildEventShareUrl(id) })
  }

  const goToMyEvents = () => {
    hSuccess()
    router.replace('/(settings)/my-events' as any)
  }

  const skipForNow = () => {
    hTap()
    router.replace(`/(events)/${id}` as any)
  }

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 16 }]}>
      <LiquidPlasmaBackground colors={['#1a1605', '#d41b81']} />
      <ConfettiRain />

      <View style={s.content}>
        <RocketIcon />

        <Text style={s.headline}>Your event is live! 🚀</Text>
        <Text style={s.sub}>Share to get your first guests and start building the vybe.</Text>

        {/* Share card */}
        <BlurView intensity={20} tint="dark" style={s.shareCard}>
          <Text style={s.shareCardLabel}>SHARE WITH FRIENDS</Text>
          <View style={s.shareRow}>
            <ShareBtn
              icon={<View style={[s.shareBtnIconInner, { backgroundColor: '#25D366' }]}><WhatsAppIcon /></View>}
              label="WhatsApp"
              onPress={shareWhatsApp}
            />
            <ShareBtn
              icon={<View style={[s.shareBtnIconInner, { backgroundColor: '#E1306C' }]}><InstagramIcon /></View>}
              label="Instagram"
              onPress={shareInstagram}
            />
            <ShareBtn
              icon={<View style={[s.shareBtnIconInner, { backgroundColor: 'rgba(255,255,255,0.1)' }]}><Link2 size={22} color="#fff" strokeWidth={1.8} /></View>}
              label="Copy Link"
              onPress={copyLink}
            />
          </View>
        </BlurView>

        {/* Primary CTA */}
        <Pressable style={s.primaryBtn} onPress={goToMyEvents}>
          <LinearGradient
            colors={['#FF6B35', '#FF3864']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.primaryGradient}
          >
            <Text style={s.primaryBtnText}>GO TO MY EVENTS</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={skipForNow} hitSlop={12}>
          <Text style={s.skipText}>Skip for now</Text>
        </Pressable>
      </View>

      {/* Off-screen — captured and shared as an image, never shown to the user */}
      {coverUrl && (
        <View style={s.shareCardHost} pointerEvents="none">
          <EventShareCard
            ref={shareCardRef}
            imageUrl={coverUrl}
            title={eventTitle}
            dateTimeLabel={dateTimeLabel}
          />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCardHost: { position: 'absolute', top: 0, left: -9999 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 420,
  },

  // Rocket
  rocketWrap: { marginBottom: 32, alignItems: 'center', justifyContent: 'center' },
  rocketCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  rocketEmoji: { fontSize: 44 },

  // Text
  headline: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.brandOrange,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: 'rgba(229,226,225,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },

  // Share card
  shareCard: {
    width: '100%',
    backgroundColor: 'rgba(20,20,20,0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 24,
    marginBottom: 32,
    overflow: 'hidden',
  },
  shareCardLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  shareRow: { flexDirection: 'row', justifyContent: 'space-around' },
  shareBtn: { alignItems: 'center', gap: 8 },
  shareBtnIcon: {},
  shareBtnIconInner: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtnLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: 'rgba(229,226,225,0.65)',
  },

  // Primary button
  primaryBtn: { width: '100%', borderRadius: 28, overflow: 'hidden', marginBottom: 20 },
  primaryGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  primaryBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: 1,
  },

  skipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
})
