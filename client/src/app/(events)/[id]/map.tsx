import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { EventsMapView } from '@/components/maps'
import { useLiveLocation } from '@/hooks/useLiveLocation'
import { BrandedLoader } from '@/components/ui'
import ApiService, { type EventDetail } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'

// Full-screen map for one event — shows the user's live location alongside
// the event pin with a route line between them (EventsMapView already draws
// this for the discover tab's multi-event map; here it's just fed a single
// event and locked onto it via activeEventId).
export default function EventMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { lat: userLat, lng: userLng, heading: userHeading } = useLiveLocation()

  useFocusEffect(useCallback(() => {
    if (!id) return
    ApiService.getEvent(id).then(setEvent).catch(() => {}).finally(() => setLoading(false))
  }, [id]))

  if (loading || !event) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
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

      <View style={[s.header, { top: insets.top + 8 }]}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color="#fff" strokeWidth={2} />
        </Pressable>
        <View style={s.titlePill}>
          <Text style={s.titleText} numberOfLines={1}>{event.location_name ?? event.title}</Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePill: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  titleText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: '#fff',
  },
})
