import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, FontFamily } from '@/constants'
import { hSelection, hTap } from '@/lib/haptics'
import { StaticEventMap } from '@/components/maps'
import type { EventDetail } from '@/api/apiService'

interface Props {
  event: EventDetail
  eventId: string
}

export function EventDetailsSection({ event, eventId }: Props) {
  const router = useRouter()
  const [showFullDesc, setShowFullDesc] = useState(false)

  return (
    <>
      {event.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text
            style={styles.sectionBody}
            numberOfLines={showFullDesc ? undefined : 3}
          >
            {event.description}
          </Text>
          {event.description.length > 140 && (
            <Pressable onPress={() => { hSelection(); setShowFullDesc(p => !p) }}>
              <Text style={styles.readMore}>{showFullDesc ? 'Show less' : 'Read more'}</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {event.rules ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>House Rules</Text>
          <Text style={styles.sectionBody}>{event.rules}</Text>
        </View>
      ) : null}

      {event.location_lat != null && event.location_lng != null && (
        <Pressable
          style={styles.miniMapWrap}
          onPress={() => { hTap(); router.push(`/(events)/${eventId}/map` as any) }}
        >
          <StaticEventMap
            lat={event.location_lat}
            lng={event.location_lng}
            eventType={event.event_type}
          />
        </Pressable>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginBottom: 8 },
  sectionBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, lineHeight: 22 },
  readMore: { color: Colors.brandOrange, fontFamily: FontFamily.bodyMedium, fontSize: 13, marginTop: 6 },

  miniMapWrap: { height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
})
