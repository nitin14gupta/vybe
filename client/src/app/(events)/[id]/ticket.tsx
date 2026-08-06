import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, PartyPopper, Share2 } from 'lucide-react-native'
import ViewShot, { type ViewShotRef } from 'react-native-view-shot'
import { Asset as MediaAsset, requestPermissionsAsync as requestMediaPermissionsAsync } from 'expo-media-library'
import { hTap, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, Spacing } from '@/constants'
import ApiService, { type TicketInfo } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { getOrFetch, peekCached } from '@/lib/queryCache'
import { ConfettiRain, BrandedLoader } from '@/components/ui'
import { useGoBack } from '@/hooks/useGoBack'
import { EventShareCard } from '@/components/events/EventShareCard'
import { TicketQrCard, fmtDate, fmtTime, parseTs } from '@/components/events/TicketQrCard'
import { TicketActionButtons } from '@/components/events/TicketActionButtons'
import { useImageShare } from '@/hooks/useImageShare'

// ── Heading block ─────────────────────────────────────────────────────────────

function HeadingBlock() {
  const fadeY = useRef(new Animated.Value(20)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeY, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[s.headingBlock, { opacity, transform: [{ translateY: fadeY }] }]}>
      <View style={s.headlineRow}>
        <Text style={s.headline}>You're going!</Text>
        <PartyPopper size={22} color={Colors.brandOrange} strokeWidth={2} />
      </View>
      <Text style={s.sub}>Your ticket is ready — show it at the door.</Text>
    </Animated.View>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const goBack = useGoBack()
  const showPill = usePillStore(s => s.show)

  const [ticket, setTicket] = useState<TicketInfo | null>(() => id ? peekCached<TicketInfo>(`ticket:v2:${id}`) : null)
  const [loading, setLoading] = useState(() => !(id && peekCached<TicketInfo>(`ticket:v2:${id}`)))
  const [loadError, setLoadError] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const cardRef = useRef<ViewShotRef>(null)
  const shareCardRef = useRef<View>(null)
  const { shareImage } = useImageShare()

  const loadTicket = () => {
    if (!id) return
    setLoading(true)
    setLoadError(false)
    getOrFetch(`ticket:v2:${id}`, () => ApiService.getMyTicket(id), {
      ttlMs: t => {
        const d = parseTs(t.date_time)
        return d ? Math.max(d.getTime() - Date.now(), 0) : 60_000
      },
    })
      .then(setTicket)
      .catch(() => {
        setLoadError(true)
        showPill("Couldn't load your ticket", 'error')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    loadTicket()
    // Cover photo only — this screen never touches live fields (RSVP status,
    // spots left), just cosmetic display for the share card, so it's as safe
    // to cache-until-event-ends as the ticket itself.
    getOrFetch(`event-cover:${id}`, () => ApiService.getEvent(id), {
      ttlMs: ev => {
        const d = parseTs(ev.date_time)
        return d ? Math.max(d.getTime() - Date.now(), 0) : 60_000
      },
    })
      .then(ev => setCoverUrl(ev.cover_photos?.[0]?.url ?? ''))
      .catch(() => {})
  }, [id])

  const handleShare = async () => {
    if (!ticket) return
    const message = `I'm going to "${ticket.event_title}"! 🎉\n${fmtDate(ticket.date_time)}${ticket.location_name ? `\n📍 ${ticket.location_name}` : ''}`
    try {
      if (coverUrl) {
        const result = await shareImage(shareCardRef, { message, title: ticket.event_title })
        if (result.shared || result.error === 'cancelled') return
      }
      await Share.share({ message, title: ticket.event_title })
    } catch {
      showPill("Couldn't share, try again", 'error')
    }
  }

  const handleSave = async () => {
    if (!cardRef.current) return
    try {
      const { status } = await requestMediaPermissionsAsync()
      if (status !== 'granted') {
        showPill('Allow photo access to save your ticket', 'error')
        return
      }
      const uri = await (cardRef.current as any).capture()
      await MediaAsset.create(uri)
      hSuccess()
      showPill('Ticket saved to Photos!', 'default')
    } catch {
      showPill("Couldn't save ticket, try again", 'error')
    }
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar style="light" />
        <BrandedLoader />
      </View>
    )
  }

  if (!ticket) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar style="light" />
        <Text style={s.errorText}>
          {loadError ? "Couldn't load your ticket" : 'Ticket not found'}
        </Text>
        {loadError && (
          <Pressable onPress={loadTicket} style={s.retryBtn}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        )}
        <Pressable onPress={goBack}>
          <Text style={s.backLinkText}>← Go back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ConfettiRain />

      {/* Content — starts behind status bar, paddingTop makes room for float bar */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Soft neutral glow bleeds into status bar area */}
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'transparent']}
          style={s.ambientGlow}
          pointerEvents="none"
        />

        <HeadingBlock />

        <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }} style={s.viewShot}>
          <TicketQrCard ticket={ticket} />
        </ViewShot>

        <TicketActionButtons onSave={handleSave} onShare={handleShare} />

        <Pressable
          style={s.allTicketsLink}
          onPress={() => router.replace('/(settings)/joined-events' as any)}
        >
          <Text style={s.allTicketsText}>View all tickets →</Text>
        </Pressable>
      </ScrollView>

      {/* Floating back + share — rendered after scroll so they sit on top */}
      <View
        style={[s.floatingBar, { top: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable style={s.circleBtn} onPress={goBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Pressable style={s.circleBtn} onPress={() => { hTap(); handleShare() }} hitSlop={8}>
          <Share2 size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* Off-screen — captured and shared as an image, never shown to the user */}
      {coverUrl && (
        <View style={s.shareCardHost} pointerEvents="none">
          <EventShareCard
            ref={shareCardRef}
            imageUrl={coverUrl}
            title={ticket.event_title}
            dateTimeLabel={`${fmtDate(ticket.date_time)}${ticket.date_time ? ` · ${fmtTime(ticket.date_time)}` : ''}`}
          />
        </View>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  shareCardHost: { position: 'absolute', top: 0, left: -9999 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    gap: 24,
  },

  // Ambient glow — absolute inside scroll, bleeds into status bar
  ambientGlow: {
    position: 'absolute',
    top: -80,
    left: -60,
    right: -60,
    height: 320,
  },

  // Floating top bar
  floatingBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Heading
  headingBlock: { alignItems: 'center', gap: 6, width: '100%' },
  headlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headline: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 32,
    color: Colors.inkPrimary,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
  },

  // Ticket card
  viewShot: { width: '100%', maxWidth: 400 },

  // Footer
  allTicketsLink: { paddingVertical: 4 },
  allTicketsText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkSecondary,
    letterSpacing: 0.1,
  },

  // Error
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkSecondary,
    marginBottom: 16,
  },
  backLinkText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.brandOrange,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.brandOrange,
    marginBottom: 16,
  },
  retryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
})
