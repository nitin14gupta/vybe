import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Share2 } from 'lucide-react-native'
import { SafetyMenuRow } from '@/components/safety/SafetyMenuRow'
import { SosRow } from './SosButton'
import { ShareEventDetailsSheet } from './ShareEventDetailsSheet'
import { formatDateTime } from './eventDetailUtils'
import { buildEventShareUrl } from '@/lib/deepLink'
import { isEventPast } from '@/lib/dates'
import { Colors, FontFamily } from '@/constants'
import type { EventDetail } from '@/api/apiService'

export function EventSafetySection({ event }: { event: EventDetail }) {
  const [shareOpen, setShareOpen] = useState(false)

  if (isEventPast(event)) return null

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Your Safety</Text>
      <View style={s.card}>
        <SafetyMenuRow
          icon={<Share2 size={20} color={Colors.inkSecondary} strokeWidth={1.6} />}
          title="Share Event Details"
          subtitle="Let a trusted contact know where you'll be"
          onPress={() => setShareOpen(true)}
        />
        <SosRow eventId={event.id} />
      </View>

      <ShareEventDetailsSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={event.title}
        dateTimeLabel={formatDateTime(event.date_time)}
        locationName={event.location_name}
        hostName={event.host_name}
        shareUrl={buildEventShareUrl(event.id)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 20 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginBottom: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
})
