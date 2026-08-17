import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { EventsMapView } from '@/components/maps'
import { EventCard } from '@/components/events/EventCard'
import { HomeGradientBackdrop } from '@/components/home/HomeGradientBackdrop'
import { useLiveLocation } from '@/hooks/useLiveLocation'
import { BrandedLoader } from '@/components/ui'
import ApiService, { type EventDetail } from '@/api/apiService'
import { Colors, FontFamily, withOpacity } from '@/constants'

export default function EventMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const { lat: userLat, lng: userLng, heading: userHeading } = useLiveLocation()

  useFocusEffect(useCallback(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => { setEvent(ev); setLoadError(false) })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [id]))

  if (loading || (!event && !loadError)) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  if (!event) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.errorText}>Couldn't load this event</Text>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <EventsMapView
        events={[event]}
        userLat={userLat}
        userLng={userLng}
        userHeading={userHeading}
        activeEventId={event.id}
        onEventSelect={() => {}}
      />

      {/* Aurora glow — same subtle overlay as the events map, top plus both side edges */}
      <HomeGradientBackdrop opacity={0.28} height={insets.top + 110} />
      <LinearGradient
        colors={[Colors.brandCoral, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.leftGlow}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[Colors.brandOrange, "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={s.rightGlow}
        pointerEvents="none"
      />

      <View style={[s.header, { top: insets.top + 8 }]}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.titlePill}>
          <Text style={s.titleText} numberOfLines={1}>{event.location_name ?? event.title}</Text>
        </View>
      </View>

      <View style={[s.cardOverlay, { bottom: insets.bottom + 16 }]}>
        <EventCard event={event} onPress={() => router.push(`/(events)/${event.id}` as any)} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },
  leftGlow: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 90, opacity: 0.28 },
  rightGlow: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 90, opacity: 0.28 },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: withOpacity(Colors.background, 0.55),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePill: {
    flex: 1,
    backgroundColor: withOpacity(Colors.background, 0.55),
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  titleText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  cardOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
})
