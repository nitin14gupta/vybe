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
import { Link2, MessageCircle, Rocket, Share2 } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'
import { ConfettiRain, ShareToChatSheet } from '@/components/ui'
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
      <Rocket size={64} color="#fff" strokeWidth={1.5} />
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
  const [chatShareOpen, setChatShareOpen] = useState(false)
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

  const shareUrl = buildEventShareUrl(id)
  const shareText = `Check out "${eventTitle}" on GORAVE! 🔥${dateTimeLabel ? `\n${dateTimeLabel}` : ''}`

  const handleShare = async () => {
    hTap()
    if (coverUrl) {
      const result = await shareImage(shareCardRef, { message: shareText, title: eventTitle })
      if (result.shared || result.error === 'cancelled') return
    }
    await Share.share({ message: shareText })
  }

  const shareInChat = () => {
    hTap()
    setChatShareOpen(true)
  }

  const copyLink = async () => {
    hTap()
    await Clipboard.setStringAsync(shareUrl)
    showPill('Link copied!', 'default')
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

        <View style={s.headlineRow}>
          <Text style={s.headline}>Your event is live!</Text>
          {/* <Rocket size={24} color={Colors.brandOrange} strokeWidth={2} /> */}
        </View>
        <Text style={s.sub}>Share to get your first guests and start building the vibe.</Text>

        {/* Share card */}
        <BlurView intensity={20} tint="dark" style={s.shareCard}>
          <Text style={s.shareCardLabel}>SHARE WITH FRIENDS</Text>
          <View style={s.shareRow}>
            <ShareBtn
              icon={<View style={[s.shareBtnIconInner, { backgroundColor: 'rgba(255,255,255,0.1)' }]}><Share2 size={22} color="#fff" strokeWidth={1.8} /></View>}
              label="Share"
              onPress={handleShare}
            />
            <ShareBtn
              icon={<View style={[s.shareBtnIconInner, { backgroundColor: 'rgba(255,255,255,0.1)' }]}><MessageCircle size={22} color="#fff" strokeWidth={1.8} /></View>}
              label="Share in Chat"
              onPress={shareInChat}
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

      <ShareToChatSheet
        visible={chatShareOpen}
        onClose={() => setChatShareOpen(false)}
        contentType="event"
        metadata={{ event_id: id, title: eventTitle, date: dateTimeLabel, cover_url: coverUrl || null }}
        previewTitle={eventTitle}
        previewSubtitle={dateTimeLabel}
        previewImage={coverUrl || null}
      />

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
  // Text
  headlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  headline: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.inkPrimary,
    textAlign: 'center',
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
